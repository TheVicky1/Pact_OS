-- PACT Phase 3 Milestone 4: Accountability Resolution & Verification Engine Migration
-- Adds verification types & configs to consequence_definitions,
-- creates accountability_verification_sessions table and accountability_waivers table,
-- and implements server-authoritative session lifecycle, evidence validation, and weekly-capped waiver RPCs.

-- 1. Extend consequence_definitions with verification type and config
ALTER TABLE public.consequence_definitions
  ADD COLUMN IF NOT EXISTS verification_type TEXT NOT NULL DEFAULT 'declaration'
  CHECK (verification_type IN ('timed_session', 'task_completion', 'written_reflection', 'declaration', 'custom')),
  ADD COLUMN IF NOT EXISTS verification_config JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 2. Table: public.accountability_verification_sessions
CREATE TABLE IF NOT EXISTS public.accountability_verification_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id UUID NOT NULL REFERENCES public.task_accountability_commitments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  required_duration_seconds INT NOT NULL DEFAULT 0 CHECK (required_duration_seconds >= 0),
  actual_duration_seconds INT CHECK (actual_duration_seconds >= 0),
  status TEXT NOT NULL DEFAULT 'started' CHECK (
    status IN ('started', 'completed', 'cancelled', 'expired')
  ),
  evidence_note TEXT,
  verification_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- At most one active ('started') verification session per commitment
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_session_per_commitment
  ON public.accountability_verification_sessions(commitment_id)
  WHERE status = 'started';

CREATE INDEX IF NOT EXISTS idx_accountability_sessions_commitment
  ON public.accountability_verification_sessions(commitment_id);
CREATE INDEX IF NOT EXISTS idx_accountability_sessions_user
  ON public.accountability_verification_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_accountability_sessions_status
  ON public.accountability_verification_sessions(user_id, status);

-- Enable RLS on verification sessions
ALTER TABLE public.accountability_verification_sessions ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON TABLE public.accountability_verification_sessions TO authenticated;
GRANT SELECT ON TABLE public.accountability_verification_sessions TO anon;

DROP POLICY IF EXISTS "Users can read own accountability sessions" ON public.accountability_verification_sessions;
CREATE POLICY "Users can read own accountability sessions"
  ON public.accountability_verification_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Hardened Trigger: Prevent direct client manipulation of accountability_verification_sessions
CREATE OR REPLACE FUNCTION public.protect_accountability_sessions_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF (current_setting('role', true) <> 'service_role' AND current_setting('pact.internal_bypass', true) IS DISTINCT FROM 'true') THEN
    IF (TG_OP = 'INSERT') THEN
      RAISE EXCEPTION 'Direct insertion into accountability_verification_sessions is prohibited. Sessions must be started via public.start_accountability_session().';
    ELSIF (TG_OP = 'UPDATE') THEN
      RAISE EXCEPTION 'Direct update of accountability_verification_sessions is prohibited. Sessions must be transitioned via server resolution RPCs.';
    ELSIF (TG_OP = 'DELETE') THEN
      IF EXISTS (SELECT 1 FROM public.task_accountability_commitments WHERE id = OLD.commitment_id) THEN
        RAISE EXCEPTION 'Direct deletion of accountability verification sessions is prohibited.';
      END IF;
    END IF;
  END IF;

  -- Once a session is completed, preserve immutable verification evidence
  IF (TG_OP = 'UPDATE' AND OLD.status = 'completed') THEN
    IF (
      OLD.evidence_note IS DISTINCT FROM NEW.evidence_note
      OR OLD.started_at IS DISTINCT FROM NEW.started_at
      OR OLD.ended_at IS DISTINCT FROM NEW.ended_at
      OR OLD.actual_duration_seconds IS DISTINCT FROM NEW.actual_duration_seconds
      OR OLD.required_duration_seconds IS DISTINCT FROM NEW.required_duration_seconds
      OR OLD.user_id <> NEW.user_id
      OR OLD.commitment_id <> NEW.commitment_id
    ) THEN
      RAISE EXCEPTION 'Completed accountability verification session records and evidence notes are immutable.';
    END IF;
  END IF;

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_accountability_sessions ON public.accountability_verification_sessions;
CREATE TRIGGER protect_accountability_sessions
  BEFORE INSERT OR UPDATE OR DELETE ON public.accountability_verification_sessions
  FOR EACH ROW EXECUTE FUNCTION public.protect_accountability_sessions_immutability();

-- 3. Table: public.accountability_waivers
CREATE TABLE IF NOT EXISTS public.accountability_waivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id UUID UNIQUE NOT NULL REFERENCES public.task_accountability_commitments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  waived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmation_token TEXT NOT NULL,
  waiver_week_year INT NOT NULL,
  waiver_week_number INT NOT NULL,
  waiver_count_in_week INT NOT NULL CHECK (waiver_count_in_week >= 1 AND waiver_count_in_week <= 3),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accountability_waivers_user_week
  ON public.accountability_waivers(user_id, waiver_week_year, waiver_week_number);
CREATE INDEX IF NOT EXISTS idx_accountability_waivers_task
  ON public.accountability_waivers(task_id);

-- Enable RLS on accountability waivers
ALTER TABLE public.accountability_waivers ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON TABLE public.accountability_waivers TO authenticated;
GRANT SELECT ON TABLE public.accountability_waivers TO anon;

DROP POLICY IF EXISTS "Users can read own accountability waivers" ON public.accountability_waivers;
CREATE POLICY "Users can read own accountability waivers"
  ON public.accountability_waivers FOR SELECT
  USING (auth.uid() = user_id);

-- Hardened Trigger: Append-only and immutable waivers
CREATE OR REPLACE FUNCTION public.protect_accountability_waivers_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF (current_setting('role', true) <> 'service_role' AND current_setting('pact.internal_bypass', true) IS DISTINCT FROM 'true') THEN
    IF (TG_OP = 'INSERT') THEN
      RAISE EXCEPTION 'Direct insertion into accountability_waivers is prohibited. Waivers must be processed via public.waive_accountability_commitment().';
    ELSIF (TG_OP = 'UPDATE') THEN
      RAISE EXCEPTION 'Accountability waiver records are immutable.';
    ELSIF (TG_OP = 'DELETE') THEN
      IF EXISTS (SELECT 1 FROM public.task_accountability_commitments WHERE id = OLD.commitment_id) THEN
        RAISE EXCEPTION 'Direct deletion of accountability waiver records is prohibited.';
      END IF;
    END IF;
  END IF;

  IF (TG_OP = 'UPDATE') THEN
    RAISE EXCEPTION 'Waiver audit records can never be modified.';
  END IF;

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_accountability_waivers ON public.accountability_waivers;
CREATE TRIGGER protect_accountability_waivers
  BEFORE INSERT OR UPDATE OR DELETE ON public.accountability_waivers
  FOR EACH ROW EXECUTE FUNCTION public.protect_accountability_waivers_immutability();

-- 4. Authoritative RPC: public.start_accountability_session(p_commitment_id UUID)
CREATE OR REPLACE FUNCTION public.start_accountability_session(p_commitment_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_commitment public.task_accountability_commitments%ROWTYPE;
  v_existing_session public.accountability_verification_sessions%ROWTYPE;
  v_new_session public.accountability_verification_sessions%ROWTYPE;
  v_req_duration INT := 0;
  v_now TIMESTAMPTZ := transaction_timestamp();
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'UNAUTHENTICATED',
      'error', 'Authentication required to start a verification session.'
    );
  END IF;

  -- Lock commitment row for update
  SELECT * INTO v_commitment
  FROM public.task_accountability_commitments
  WHERE id = p_commitment_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'NOT_FOUND',
      'error', 'Accountability commitment not found or access denied.'
    );
  END IF;

  IF v_commitment.commitment_status <> 'activated' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'COMMITMENT_NOT_ACTIVATED',
      'error', 'Only activated accountability commitments can start verification sessions.',
      'commitment_status', v_commitment.commitment_status
    );
  END IF;

  -- Check if an active session already exists (allows client reconnect/resume without state destruction)
  SELECT * INTO v_existing_session
  FROM public.accountability_verification_sessions
  WHERE commitment_id = p_commitment_id AND status = 'started';

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'code', 'SESSION_ALREADY_ACTIVE',
      'data', to_jsonb(v_existing_session)
    );
  END IF;

  -- Extract required duration from immutable snapshot
  IF v_commitment.consequence_snapshot ? 'verification_config' THEN
    v_req_duration := COALESCE((v_commitment.consequence_snapshot->'verification_config'->>'required_duration_seconds')::int, 0);
  END IF;

  -- Enable internal bypass to insert session
  PERFORM set_config('pact.internal_bypass', 'true', true);

  INSERT INTO public.accountability_verification_sessions (
    commitment_id,
    user_id,
    started_at,
    required_duration_seconds,
    status,
    verification_metadata
  ) VALUES (
    p_commitment_id,
    v_user_id,
    v_now,
    v_req_duration,
    'started',
    jsonb_build_object(
      'verification_type', COALESCE(v_commitment.consequence_snapshot->>'verification_type', 'timed_session')
    )
  ) RETURNING * INTO v_new_session;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'SESSION_STARTED',
    'data', to_jsonb(v_new_session)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.start_accountability_session(UUID) TO authenticated;

-- 5. Authoritative RPC: public.fulfill_accountability_session(p_session_id UUID, p_evidence_note TEXT)
CREATE OR REPLACE FUNCTION public.fulfill_accountability_session(
  p_session_id UUID,
  p_evidence_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_session public.accountability_verification_sessions%ROWTYPE;
  v_commitment public.task_accountability_commitments%ROWTYPE;
  v_now TIMESTAMPTZ := transaction_timestamp();
  v_elapsed_seconds INT;
  v_trimmed_note TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'UNAUTHENTICATED',
      'error', 'Authentication required to fulfill a verification session.'
    );
  END IF;

  -- Lock session row for update
  SELECT * INTO v_session
  FROM public.accountability_verification_sessions
  WHERE id = p_session_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'NOT_FOUND',
      'error', 'Verification session not found or access denied.'
    );
  END IF;

  -- Idempotency check: if session already completed, return idempotent success
  IF v_session.status = 'completed' THEN
    RETURN jsonb_build_object(
      'success', true,
      'code', 'ALREADY_FULFILLED',
      'error', 'Session has already been fulfilled.',
      'data', to_jsonb(v_session)
    );
  END IF;

  IF v_session.status <> 'started' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INVALID_SESSION_STATUS',
      'error', 'Only active sessions in "started" status can be fulfilled.',
      'session_status', v_session.status
    );
  END IF;

  -- Lock parent commitment row
  SELECT * INTO v_commitment
  FROM public.task_accountability_commitments
  WHERE id = v_session.commitment_id AND user_id = v_user_id
  FOR UPDATE;

  IF v_commitment.commitment_status <> 'activated' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'COMMITMENT_NOT_ACTIVATED',
      'error', 'Parent commitment is not in activated status.',
      'commitment_status', v_commitment.commitment_status
    );
  END IF;

  -- Server-Authoritative Duration Verification
  v_elapsed_seconds := EXTRACT(EPOCH FROM (v_now - v_session.started_at))::int;

  IF v_elapsed_seconds < v_session.required_duration_seconds THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'DURATION_NOT_MET',
      'error', 'Required session duration has not elapsed yet. Server time is authoritative.',
      'required_seconds', v_session.required_duration_seconds,
      'elapsed_seconds', v_elapsed_seconds
    );
  END IF;

  -- Activity / Evidence Note Validation (required for timed sessions or when duration > 0)
  v_trimmed_note := NULLIF(trim(COALESCE(p_evidence_note, '')), '');
  IF v_session.required_duration_seconds > 0 THEN
    IF v_trimmed_note IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'code', 'EVIDENCE_REQUIRED',
        'error', 'An activity note describing what you worked on is required for verification.'
      );
    END IF;
  END IF;

  IF v_trimmed_note IS NOT NULL AND length(v_trimmed_note) > 5000 THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'EVIDENCE_TOO_LONG',
      'error', 'Activity note must not exceed 5000 characters.'
    );
  END IF;

  -- Enable internal bypass to atomically fulfill session, commitment, and log event
  PERFORM set_config('pact.internal_bypass', 'true', true);

  -- Update session to completed
  UPDATE public.accountability_verification_sessions
  SET
    status = 'completed',
    ended_at = v_now,
    actual_duration_seconds = v_elapsed_seconds,
    evidence_note = v_trimmed_note,
    updated_at = v_now
  WHERE id = p_session_id
  RETURNING * INTO v_session;

  -- Update commitment to fulfilled
  UPDATE public.task_accountability_commitments
  SET
    commitment_status = 'fulfilled',
    updated_at = v_now
  WHERE id = v_commitment.id;

  -- Record append-only fulfilled event
  INSERT INTO public.accountability_events (
    user_id,
    task_id,
    commitment_id,
    event_type,
    created_at,
    metadata
  ) VALUES (
    v_user_id,
    v_commitment.task_id,
    v_commitment.id,
    'fulfilled',
    v_now,
    jsonb_build_object(
      'session_id', v_session.id,
      'duration_seconds', v_elapsed_seconds,
      'evidence_note', v_trimmed_note
    )
  ) ON CONFLICT (commitment_id, event_type) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'FULFILLED',
    'data', to_jsonb(v_session)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.fulfill_accountability_session(UUID, TEXT) TO authenticated;

-- 6. Authoritative RPC: public.cancel_accountability_session(p_session_id UUID)
CREATE OR REPLACE FUNCTION public.cancel_accountability_session(p_session_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_session public.accountability_verification_sessions%ROWTYPE;
  v_now TIMESTAMPTZ := transaction_timestamp();
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'UNAUTHENTICATED',
      'error', 'Authentication required to cancel a verification session.'
    );
  END IF;

  SELECT * INTO v_session
  FROM public.accountability_verification_sessions
  WHERE id = p_session_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'NOT_FOUND',
      'error', 'Verification session not found or access denied.'
    );
  END IF;

  IF v_session.status <> 'started' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INVALID_SESSION_STATUS',
      'error', 'Only sessions in "started" status can be cancelled.',
      'session_status', v_session.status
    );
  END IF;

  PERFORM set_config('pact.internal_bypass', 'true', true);

  UPDATE public.accountability_verification_sessions
  SET
    status = 'cancelled',
    ended_at = v_now,
    updated_at = v_now
  WHERE id = p_session_id
  RETURNING * INTO v_session;

  -- Commitment status remains 'activated' (session cancellation does NOT waive or resolve consequence)
  RETURN jsonb_build_object(
    'success', true,
    'code', 'SESSION_CANCELLED',
    'data', to_jsonb(v_session)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_accountability_session(UUID) TO authenticated;

-- 7. Authoritative RPC: public.waive_accountability_commitment(p_commitment_id UUID, p_confirmation_token TEXT)
CREATE OR REPLACE FUNCTION public.waive_accountability_commitment(
  p_commitment_id UUID,
  p_confirmation_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_commitment public.task_accountability_commitments%ROWTYPE;
  v_user_tz TEXT;
  v_now TIMESTAMPTZ := transaction_timestamp();
  v_week_year INT;
  v_week_number INT;
  v_weekly_waiver_count INT;
  v_waiver public.accountability_waivers%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'UNAUTHENTICATED',
      'error', 'Authentication required to waive an accountability commitment.'
    );
  END IF;

  -- Server-side confirmation token validation
  -- Note: User-facing confirmation word is intentionally deferred; CONFIRM_WAIVER_V1 is the internal domain token
  IF p_confirmation_token IS NULL OR trim(p_confirmation_token) <> 'CONFIRM_WAIVER_V1' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INVALID_CONFIRMATION_TOKEN',
      'error', 'Waiver requires explicit server-validated confirmation token.'
    );
  END IF;

  -- Lock commitment row for update
  SELECT * INTO v_commitment
  FROM public.task_accountability_commitments
  WHERE id = p_commitment_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'NOT_FOUND',
      'error', 'Accountability commitment not found or access denied.'
    );
  END IF;

  -- Idempotency check
  IF v_commitment.commitment_status = 'waived' THEN
    RETURN jsonb_build_object(
      'success', true,
      'code', 'ALREADY_WAIVED',
      'error', 'Commitment is already waived.'
    );
  END IF;

  IF v_commitment.commitment_status <> 'activated' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'COMMITMENT_NOT_ACTIVATED',
      'error', 'Only activated accountability commitments can be waived.',
      'commitment_status', v_commitment.commitment_status
    );
  END IF;

  -- Lock user profile row to strictly serialize concurrent waiver requests and prevent race condition bypassing quota
  SELECT timezone INTO v_user_tz
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_user_tz IS NULL OR trim(v_user_tz) = '' THEN
    v_user_tz := 'UTC';
  END IF;

  -- Deterministic calendar-week calculation in user's profile timezone (ISO week: Monday = start)
  v_week_year := EXTRACT(isoyear FROM (v_now AT TIME ZONE v_user_tz))::int;
  v_week_number := EXTRACT(week FROM (v_now AT TIME ZONE v_user_tz))::int;

  -- Count existing waivers in this calendar week for this user
  SELECT count(*) INTO v_weekly_waiver_count
  FROM public.accountability_waivers
  WHERE user_id = v_user_id
    AND waiver_week_year = v_week_year
    AND waiver_week_number = v_week_number;

  -- Enforce hard quota: 3 waivers per calendar week
  IF v_weekly_waiver_count >= 3 THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'WAIVER_LIMIT_EXCEEDED',
      'error', 'Weekly waiver limit of 3 reached for this calendar week.',
      'weekly_waiver_count', v_weekly_waiver_count,
      'week_year', v_week_year,
      'week_number', v_week_number
    );
  END IF;

  -- Enable internal bypass to record waiver and transition commitment status
  PERFORM set_config('pact.internal_bypass', 'true', true);

  -- If any active session was started, cancel it
  UPDATE public.accountability_verification_sessions
  SET
    status = 'cancelled',
    ended_at = v_now,
    updated_at = v_now
  WHERE commitment_id = p_commitment_id AND status = 'started';

  -- Insert immutable waiver record
  INSERT INTO public.accountability_waivers (
    commitment_id,
    user_id,
    task_id,
    waived_at,
    confirmation_token,
    waiver_week_year,
    waiver_week_number,
    waiver_count_in_week,
    metadata
  ) VALUES (
    p_commitment_id,
    v_user_id,
    v_commitment.task_id,
    v_now,
    trim(p_confirmation_token),
    v_week_year,
    v_week_number,
    v_weekly_waiver_count + 1,
    jsonb_build_object(
      'timezone', v_user_tz,
      'consequence_type', v_commitment.consequence_snapshot->>'consequence_type'
    )
  ) RETURNING * INTO v_waiver;

  -- Transition commitment status to 'waived'
  UPDATE public.task_accountability_commitments
  SET
    commitment_status = 'waived',
    updated_at = v_now
  WHERE id = p_commitment_id;

  -- Record append-only waived event
  INSERT INTO public.accountability_events (
    user_id,
    task_id,
    commitment_id,
    event_type,
    created_at,
    metadata
  ) VALUES (
    v_user_id,
    v_commitment.task_id,
    p_commitment_id,
    'waived',
    v_now,
    jsonb_build_object(
      'waiver_id', v_waiver.id,
      'waiver_count_in_week', v_weekly_waiver_count + 1,
      'waiver_week_year', v_week_year,
      'waiver_week_number', v_week_number,
      'timezone', v_user_tz
    )
  ) ON CONFLICT (commitment_id, event_type) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'WAIVED',
    'waiver_count_in_week', v_weekly_waiver_count + 1,
    'data', to_jsonb(v_waiver)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.waive_accountability_commitment(UUID, TEXT) TO authenticated;
