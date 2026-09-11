-- ====================================================================
-- PACT Phase 6B: Focus Timer & Deep Work Session Engine
-- Table: public.focus_sessions
-- Authoritative server-side lifecycle state machine & strict RLS
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.focus_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    mode TEXT NOT NULL CHECK (mode IN ('countdown', 'stopwatch')),
    planned_duration_seconds INTEGER NOT NULL DEFAULT 1500 CHECK (planned_duration_seconds >= 0),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    accumulated_paused_seconds INTEGER NOT NULL DEFAULT 0 CHECK (accumulated_paused_seconds >= 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
    completion_reason TEXT CHECK (completion_reason IN ('timer_expired', 'manual_complete', 'user_abandoned', 'auto_reconciled')),
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Authoritative Partial Unique Index: Strictly 1 active/paused session per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_focus_sessions_single_active 
ON public.focus_sessions (user_id) 
WHERE status IN ('active', 'paused');

-- Hot Path Query Indexes
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_status_created 
ON public.focus_sessions (user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_task 
ON public.focus_sessions (task_id);

-- Enable Row Level Security
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own focus sessions" 
ON public.focus_sessions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own focus sessions" 
ON public.focus_sessions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own focus sessions" 
ON public.focus_sessions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own focus sessions" 
ON public.focus_sessions FOR DELETE 
USING (auth.uid() = user_id);

-- ====================================================================
-- Stored Procedures: Authoritative Focus Session Lifecycle
-- ====================================================================

-- 1. Start Focus Session
CREATE OR REPLACE FUNCTION public.pact_start_focus_session(
    p_user_id UUID,
    p_task_id UUID DEFAULT NULL,
    p_mode TEXT DEFAULT 'countdown',
    p_planned_duration_seconds INTEGER DEFAULT 1500,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_existing_id UUID;
    v_new_session public.focus_sessions%ROWTYPE;
BEGIN
    -- Check for existing active or paused session
    SELECT id INTO v_existing_id
    FROM public.focus_sessions
    WHERE user_id = p_user_id AND status IN ('active', 'paused')
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        RAISE EXCEPTION 'An active or paused focus session already exists for this user.'
            USING ERRCODE = '23505';
    END IF;

    -- If task_id provided, verify task ownership
    IF p_task_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.tasks WHERE id = p_task_id AND user_id = p_user_id) THEN
            RAISE EXCEPTION 'Task not found or access denied.'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    INSERT INTO public.focus_sessions (
        user_id,
        task_id,
        mode,
        planned_duration_seconds,
        started_at,
        status,
        notes
    ) VALUES (
        p_user_id,
        p_task_id,
        p_mode,
        p_planned_duration_seconds,
        NOW(),
        'active',
        p_notes
    )
    RETURNING * INTO v_new_session;

    RETURN to_jsonb(v_new_session);
END;
$$;

-- 2. Pause Focus Session
CREATE OR REPLACE FUNCTION public.pact_pause_focus_session(
    p_user_id UUID,
    p_session_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_session public.focus_sessions%ROWTYPE;
BEGIN
    SELECT * INTO v_session
    FROM public.focus_sessions
    WHERE id = p_session_id AND user_id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Focus session not found.' USING ERRCODE = 'P0002';
    END IF;

    IF v_session.status != 'active' THEN
        RAISE EXCEPTION 'Cannot pause a session with status: %', v_session.status
            USING ERRCODE = '22023';
    END IF;

    UPDATE public.focus_sessions
    SET 
        status = 'paused',
        paused_at = NOW(),
        updated_at = NOW()
    WHERE id = p_session_id
    RETURNING * INTO v_session;

    RETURN to_jsonb(v_session);
END;
$$;

-- 3. Resume Focus Session
CREATE OR REPLACE FUNCTION public.pact_resume_focus_session(
    p_user_id UUID,
    p_session_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_session public.focus_sessions%ROWTYPE;
    v_pause_delta INTEGER;
BEGIN
    SELECT * INTO v_session
    FROM public.focus_sessions
    WHERE id = p_session_id AND user_id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Focus session not found.' USING ERRCODE = 'P0002';
    END IF;

    IF v_session.status != 'paused' THEN
        RAISE EXCEPTION 'Cannot resume a session with status: %', v_session.status
            USING ERRCODE = '22023';
    END IF;

    -- Calculate seconds elapsed while paused
    v_pause_delta := GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - v_session.paused_at)))::INTEGER);

    UPDATE public.focus_sessions
    SET 
        status = 'active',
        paused_at = NULL,
        accumulated_paused_seconds = v_session.accumulated_paused_seconds + v_pause_delta,
        updated_at = NOW()
    WHERE id = p_session_id
    RETURNING * INTO v_session;

    RETURN to_jsonb(v_session);
END;
$$;

-- 4. Complete Focus Session
CREATE OR REPLACE FUNCTION public.pact_complete_focus_session(
    p_user_id UUID,
    p_session_id UUID,
    p_reason TEXT DEFAULT 'manual_complete'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_session public.focus_sessions%ROWTYPE;
    v_pause_delta INTEGER := 0;
BEGIN
    SELECT * INTO v_session
    FROM public.focus_sessions
    WHERE id = p_session_id AND user_id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Focus session not found.' USING ERRCODE = 'P0002';
    END IF;

    -- Idempotent check: If already completed, return immediately
    IF v_session.status = 'completed' THEN
        RETURN to_jsonb(v_session);
    END IF;

    IF v_session.status NOT IN ('active', 'paused') THEN
        RAISE EXCEPTION 'Cannot complete a session with status: %', v_session.status
            USING ERRCODE = '22023';
    END IF;

    IF v_session.status = 'paused' AND v_session.paused_at IS NOT NULL THEN
        v_pause_delta := GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - v_session.paused_at)))::INTEGER);
    END IF;

    UPDATE public.focus_sessions
    SET 
        status = 'completed',
        ended_at = NOW(),
        paused_at = NULL,
        accumulated_paused_seconds = v_session.accumulated_paused_seconds + v_pause_delta,
        completion_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_session_id
    RETURNING * INTO v_session;

    RETURN to_jsonb(v_session);
END;
$$;

-- 5. Abandon Focus Session
CREATE OR REPLACE FUNCTION public.pact_abandon_focus_session(
    p_user_id UUID,
    p_session_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_session public.focus_sessions%ROWTYPE;
BEGIN
    SELECT * INTO v_session
    FROM public.focus_sessions
    WHERE id = p_session_id AND user_id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Focus session not found.' USING ERRCODE = 'P0002';
    END IF;

    IF v_session.status NOT IN ('active', 'paused') THEN
        RAISE EXCEPTION 'Cannot abandon a session with status: %', v_session.status
            USING ERRCODE = '22023';
    END IF;

    UPDATE public.focus_sessions
    SET 
        status = 'abandoned',
        ended_at = NOW(),
        paused_at = NULL,
        completion_reason = 'user_abandoned',
        updated_at = NOW()
    WHERE id = p_session_id
    RETURNING * INTO v_session;

    RETURN to_jsonb(v_session);
END;
$$;
