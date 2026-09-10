-- ====================================================================
-- PACT Phase 6C: Recurring Habits & Daily Routine Template Engine
-- Tables:
--   1. public.habit_templates
--   2. public.habit_occurrences
--   3. public.routine_templates
--   4. public.routine_template_items
-- Includes strict RLS, unique constraints, and authoritative stored procedures.
-- ====================================================================

-- 1. Habit Templates Table
CREATE TABLE IF NOT EXISTS public.habit_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(trim(name)) >= 1 AND char_length(name) <= 255),
    description TEXT CHECK (description IS NULL OR char_length(description) <= 2000),
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'health', 'learning', 'productivity', 'mindset', 'fitness', 'finance')),
    frequency_type TEXT NOT NULL CHECK (frequency_type IN ('daily', 'weekdays', 'selected_days', 'weekly', 'custom_interval')),
    selected_days INTEGER[] NOT NULL DEFAULT '{}',
    interval_days INTEGER NOT NULL DEFAULT 1 CHECK (interval_days >= 1 AND interval_days <= 365),
    target_time_local TEXT CHECK (target_time_local IS NULL OR target_time_local ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
    target_duration_minutes INTEGER CHECK (target_duration_minutes IS NULL OR (target_duration_minutes >= 1 AND target_duration_minutes <= 1440)),
    linked_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE CHECK (end_date IS NULL OR end_date >= start_date),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Habit Occurrences Table
CREATE TABLE IF NOT EXISTS public.habit_occurrences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    habit_template_id UUID NOT NULL REFERENCES public.habit_templates(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped', 'missed')),
    completed_at TIMESTAMPTZ,
    notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 1000),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Routine Templates Table
CREATE TABLE IF NOT EXISTS public.routine_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(trim(name)) >= 1 AND char_length(name) <= 255),
    description TEXT CHECK (description IS NULL OR char_length(description) <= 2000),
    target_time_local TEXT CHECK (target_time_local IS NULL OR target_time_local ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Routine Template Items Table
CREATE TABLE IF NOT EXISTS public.routine_template_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    routine_template_id UUID NOT NULL REFERENCES public.routine_templates(id) ON DELETE CASCADE,
    habit_template_id UUID NOT NULL REFERENCES public.habit_templates(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- Indexes for Idempotency, Duplicate Prevention, and Fast Queries
-- ====================================================================

-- Authoritative Unique Index: Exactly 1 occurrence per habit per calendar day per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_habit_occurrences_unique_scheduled 
ON public.habit_occurrences (user_id, habit_template_id, scheduled_date);

-- Routine Item Unique Index: 1 entry per habit per routine
CREATE UNIQUE INDEX IF NOT EXISTS idx_routine_items_unique 
ON public.routine_template_items (routine_template_id, habit_template_id);

-- Hot-path Query Indexes
CREATE INDEX IF NOT EXISTS idx_habit_templates_user_status 
ON public.habit_templates (user_id, status, sort_order);

CREATE INDEX IF NOT EXISTS idx_habit_occurrences_user_date 
ON public.habit_occurrences (user_id, scheduled_date, status);

CREATE INDEX IF NOT EXISTS idx_routine_templates_user 
ON public.routine_templates (user_id, is_active, sort_order);

CREATE INDEX IF NOT EXISTS idx_routine_items_routine 
ON public.routine_template_items (routine_template_id, sort_order);

-- ====================================================================
-- Row-Level Security (Tenant Isolation)
-- ====================================================================

ALTER TABLE public.habit_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_template_items ENABLE ROW LEVEL SECURITY;

-- habit_templates RLS
CREATE POLICY "Users can view own habit templates" 
ON public.habit_templates FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habit templates" 
ON public.habit_templates FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habit templates" 
ON public.habit_templates FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit templates" 
ON public.habit_templates FOR DELETE USING (auth.uid() = user_id);

-- habit_occurrences RLS
CREATE POLICY "Users can view own habit occurrences" 
ON public.habit_occurrences FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habit occurrences" 
ON public.habit_occurrences FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habit occurrences" 
ON public.habit_occurrences FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit occurrences" 
ON public.habit_occurrences FOR DELETE USING (auth.uid() = user_id);

-- routine_templates RLS
CREATE POLICY "Users can view own routine templates" 
ON public.routine_templates FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own routine templates" 
ON public.routine_templates FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own routine templates" 
ON public.routine_templates FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own routine templates" 
ON public.routine_templates FOR DELETE USING (auth.uid() = user_id);

-- routine_template_items RLS
CREATE POLICY "Users can view own routine items" 
ON public.routine_template_items FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own routine items" 
ON public.routine_template_items FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own routine items" 
ON public.routine_template_items FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own routine items" 
ON public.routine_template_items FOR DELETE USING (auth.uid() = user_id);

-- ====================================================================
-- Stored Procedures: Authoritative Habit & Occurrence Lifecycle
-- ====================================================================

-- 1. Complete a Habit Occurrence
CREATE OR REPLACE FUNCTION public.pact_complete_habit_occurrence(
    p_user_id UUID,
    p_occurrence_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_occ public.habit_occurrences%ROWTYPE;
BEGIN
    SELECT * INTO v_occ
    FROM public.habit_occurrences
    WHERE id = p_occurrence_id AND user_id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Habit occurrence not found.' USING ERRCODE = 'P0002';
    END IF;

    -- Idempotent check: if already completed, update notes if provided
    IF v_occ.status = 'completed' THEN
        IF p_notes IS NOT NULL THEN
            UPDATE public.habit_occurrences
            SET notes = p_notes, updated_at = NOW()
            WHERE id = p_occurrence_id
            RETURNING * INTO v_occ;
        END IF;
        RETURN to_jsonb(v_occ);
    END IF;

    UPDATE public.habit_occurrences
    SET 
        status = 'completed',
        completed_at = NOW(),
        notes = COALESCE(p_notes, v_occ.notes),
        updated_at = NOW()
    WHERE id = p_occurrence_id
    RETURNING * INTO v_occ;

    RETURN to_jsonb(v_occ);
END;
$$;

-- 2. Uncomplete (Undo) a Habit Occurrence
CREATE OR REPLACE FUNCTION public.pact_uncomplete_habit_occurrence(
    p_user_id UUID,
    p_occurrence_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_occ public.habit_occurrences%ROWTYPE;
BEGIN
    SELECT * INTO v_occ
    FROM public.habit_occurrences
    WHERE id = p_occurrence_id AND user_id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Habit occurrence not found.' USING ERRCODE = 'P0002';
    END IF;

    UPDATE public.habit_occurrences
    SET 
        status = 'pending',
        completed_at = NULL,
        updated_at = NOW()
    WHERE id = p_occurrence_id
    RETURNING * INTO v_occ;

    RETURN to_jsonb(v_occ);
END;
$$;

-- 3. Skip a Habit Occurrence
CREATE OR REPLACE FUNCTION public.pact_skip_habit_occurrence(
    p_user_id UUID,
    p_occurrence_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_occ public.habit_occurrences%ROWTYPE;
BEGIN
    SELECT * INTO v_occ
    FROM public.habit_occurrences
    WHERE id = p_occurrence_id AND user_id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Habit occurrence not found.' USING ERRCODE = 'P0002';
    END IF;

    UPDATE public.habit_occurrences
    SET 
        status = 'skipped',
        notes = COALESCE(p_notes, v_occ.notes),
        updated_at = NOW()
    WHERE id = p_occurrence_id
    RETURNING * INTO v_occ;

    RETURN to_jsonb(v_occ);
END;
$$;
