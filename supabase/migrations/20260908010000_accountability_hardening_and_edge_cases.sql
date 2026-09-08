-- PACT Phase 3 Milestone 5: Accountability Rules, Resolution Edge Cases & Final Hardening Migration
-- 1. Explicit verification RPCs: fulfill_written_reflection, declare_accountability_fulfillment, fulfill_task_completion_commitment
-- 2. State machine transition invariants on task_accountability_commitments
-- 3. Table-level defense-in-depth trigger enforcing weekly waiver limit <= 3

-- ----------------------------------------------------------------
-- 1. Authoritative RPC: public.fulfill_written_reflection(p_commitment_id UUID, p_reflection_text TEXT)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fulfill_written_reflection(
  p_commitment_id UUID,
  p_reflection_text TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_commitment public.task_accountability_commitments%ROWTYPE;
  v_now TIMESTAMPTZ := transaction_timestamp();
  v_trimmed_text TEXT;
  v_verif_type TEXT;
  v_session public.accountability_verification_sessions%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'UNAUTHENTICATED',
      'error', 'Authentication required to fulfill accountability.'
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

  -- Idempotency check: if commitment already fulfilled, return success
  IF v_commitment.commitment_status = 'fulfilled' THEN
    RETURN jsonb_build_object(
      'success', true,
      'code', 'ALREADY_FULFILLED',
      'error', 'Commitment has already been fulfilled.'
    );
  END IF;

  IF v_commitment.commitment_status <> 'activated' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'COMMITMENT_NOT_ACTIVATED',
      'error', 'Only activated accountability commitments can be fulfilled.',
      'commitment_status', v_commitment.commitment_status
    );
  END IF;

  -- Enforce verification type matches snapshotted consequence rule
  v_verif_type := COALESCE(v_commitment.consequence_snapshot->>'verification_type', '');
  IF v_verif_type <> 'written_reflection' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INVALID_VERIFICATION_TYPE',
      'error', 'Written reflection cannot fulfill consequence requiring: ' || v_verif_type,
      'required_verification_type', v_verif_type
    );
  END IF;

  -- Strict reflection content validation: min 20 chars, max 5000 chars, no whitespace-only
  v_trimmed_text := NULLIF(trim(COALESCE(p_reflection_text, '')), '');
  IF v_trimmed_text IS NULL OR length(v_trimmed_text) < 20 THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'REFLECTION_TOO_SHORT',
      'error', 'Written reflection must be at least 20 characters in length.'
    );
  END IF;

  IF length(v_trimmed_text) > 5000 THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'REFLECTION_TOO_LONG',
      'error', 'Written reflection must not exceed 5000 characters.'
    );
  END IF;

  -- Enable internal bypass to transition commitment, record event, and create session record
  PERFORM set_config('pact.internal_bypass', 'true', true);

  -- Transition commitment to fulfilled
  UPDATE public.task_accountability_commitments
  SET
    commitment_status = 'fulfilled',
    updated_at = v_now
  WHERE id = p_commitment_id;

  -- Insert immutable fulfilled event with reflection metadata
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
      'verification_type', 'written_reflection',
      'verified_objectively', false,
      'reflection_text', v_trimmed_text,
      'character_count', length(v_trimmed_text)
    )
  ) ON CONFLICT (commitment_id, event_type) DO NOTHING;

  -- Record completed session row for unified history
  INSERT INTO public.accountability_verification_sessions (
    commitment_id,
    user_id,
    started_at,
    ended_at,
    required_duration_seconds,
    actual_duration_seconds,
    status,
    evidence_note,
    verification_metadata
  ) VALUES (
    p_commitment_id,
    v_user_id,
    v_now,
    v_now,
    0,
    0,
    'completed',
    v_trimmed_text,
    jsonb_build_object(
      'verification_type', 'written_reflection',
      'verified_objectively', false
    )
  ) RETURNING * INTO v_session;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'FULFILLED',
    'verification_type', 'written_reflection',
    'data', to_jsonb(v_session)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.fulfill_written_reflection(UUID, TEXT) TO authenticated;

-- ----------------------------------------------------------------
-- 2. Authoritative RPC: public.declare_accountability_fulfillment(p_commitment_id UUID, p_declaration_statement TEXT)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.declare_accountability_fulfillment(
  p_commitment_id UUID,
  p_declaration_statement TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_commitment public.task_accountability_commitments%ROWTYPE;
  v_now TIMESTAMPTZ := transaction_timestamp();
  v_trimmed_statement TEXT;
  v_verif_type TEXT;
  v_session public.accountability_verification_sessions%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'UNAUTHENTICATED',
      'error', 'Authentication required to declare fulfillment.'
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

  -- Idempotency check: if commitment already fulfilled, return success
  IF v_commitment.commitment_status = 'fulfilled' THEN
    RETURN jsonb_build_object(
      'success', true,
      'code', 'ALREADY_FULFILLED',
      'error', 'Commitment has already been fulfilled.'
    );
  END IF;

  IF v_commitment.commitment_status <> 'activated' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'COMMITMENT_NOT_ACTIVATED',
      'error', 'Only activated accountability commitments can be fulfilled.',
      'commitment_status', v_commitment.commitment_status
    );
  END IF;

  -- Enforce that consequence definition explicitly permits declaration
  v_verif_type := COALESCE(v_commitment.consequence_snapshot->>'verification_type', 'declaration');
  IF v_verif_type <> 'declaration' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'DECLARATION_NOT_PERMITTED',
      'error', 'Self-declaration is not permitted for consequence requiring: ' || v_verif_type,
      'required_verification_type', v_verif_type
    );
  END IF;

  -- Statement validation: non-empty, max 1000 chars
  v_trimmed_statement := NULLIF(trim(COALESCE(p_declaration_statement, '')), '');
  IF v_trimmed_statement IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'DECLARATION_STATEMENT_REQUIRED',
      'error', 'A declaration statement is required to attest completion.'
    );
  END IF;

  IF length(v_trimmed_statement) > 1000 THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'DECLARATION_STATEMENT_TOO_LONG',
      'error', 'Declaration statement must not exceed 1000 characters.'
    );
  END IF;

  -- Enable internal bypass to transition commitment, record event, and create session record
  PERFORM set_config('pact.internal_bypass', 'true', true);

  -- Transition commitment to fulfilled
  UPDATE public.task_accountability_commitments
  SET
    commitment_status = 'fulfilled',
    updated_at = v_now
  WHERE id = p_commitment_id;

  -- Insert immutable fulfilled event explicitly marking as self-declaration (NOT objectively verified)
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
      'verification_type', 'declaration',
      'is_self_declaration', true,
      'verified_objectively', false,
      'declaration_statement', v_trimmed_statement
    )
  ) ON CONFLICT (commitment_id, event_type) DO NOTHING;

  -- Record completed session row with self-declaration indicator
  INSERT INTO public.accountability_verification_sessions (
    commitment_id,
    user_id,
    started_at,
    ended_at,
    required_duration_seconds,
    actual_duration_seconds,
    status,
    evidence_note,
    verification_metadata
  ) VALUES (
    p_commitment_id,
    v_user_id,
    v_now,
    v_now,
    0,
    0,
    'completed',
    v_trimmed_statement,
    jsonb_build_object(
      'verification_type', 'declaration',
      'is_self_declaration', true,
      'verified_objectively', false
    )
  ) RETURNING * INTO v_session;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'FULFILLED',
    'verification_type', 'declaration',
    'is_self_declaration', true,
    'data', to_jsonb(v_session)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.declare_accountability_fulfillment(UUID, TEXT) TO authenticated;

-- ----------------------------------------------------------------
-- 3. Authoritative RPC: public.fulfill_task_completion_commitment(p_commitment_id UUID, p_target_task_id UUID)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fulfill_task_completion_commitment(
  p_commitment_id UUID,
  p_target_task_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_commitment public.task_accountability_commitments%ROWTYPE;
  v_target_task public.tasks%ROWTYPE;
  v_now TIMESTAMPTZ := transaction_timestamp();
  v_verif_type TEXT;
  v_session public.accountability_verification_sessions%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'UNAUTHENTICATED',
      'error', 'Authentication required to fulfill accountability.'
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

  -- Idempotency check: if commitment already fulfilled, return success
  IF v_commitment.commitment_status = 'fulfilled' THEN
    RETURN jsonb_build_object(
      'success', true,
      'code', 'ALREADY_FULFILLED',
      'error', 'Commitment has already been fulfilled.'
    );
  END IF;

  IF v_commitment.commitment_status <> 'activated' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'COMMITMENT_NOT_ACTIVATED',
      'error', 'Only activated accountability commitments can be fulfilled.',
      'commitment_status', v_commitment.commitment_status
    );
  END IF;

  -- Enforce verification type in snapshot is task_completion
  v_verif_type := COALESCE(v_commitment.consequence_snapshot->>'verification_type', '');
  IF v_verif_type <> 'task_completion' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INVALID_VERIFICATION_TYPE',
      'error', 'Task completion cannot fulfill consequence requiring: ' || v_verif_type,
      'required_verification_type', v_verif_type
    );
  END IF;

  -- Circular / self-referential defense: task cannot fulfill its own consequence
  IF v_commitment.task_id = p_target_task_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'CIRCULAR_TASK_REFERENCE',
      'error', 'A task cannot serve as its own completion consequence.'
    );
  END IF;

  -- Target task ownership and existence check
  SELECT * INTO v_target_task
  FROM public.tasks
  WHERE id = p_target_task_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'TARGET_TASK_NOT_FOUND',
      'error', 'Target task not found or access denied.'
    );
  END IF;

  -- Authoritative lifecycle verification: target task MUST be completed
  IF v_target_task.status <> 'completed' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'TARGET_TASK_NOT_COMPLETED',
      'error', 'Target task must be in authoritative completed status to fulfill consequence.',
      'target_task_status', v_target_task.status
    );
  END IF;

  -- Enable internal bypass
  PERFORM set_config('pact.internal_bypass', 'true', true);

  -- Transition commitment to fulfilled
  UPDATE public.task_accountability_commitments
  SET
    commitment_status = 'fulfilled',
    updated_at = v_now
  WHERE id = p_commitment_id;

  -- Insert immutable fulfilled event with task completion metadata
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
      'verification_type', 'task_completion',
      'verified_objectively', true,
      'target_task_id', p_target_task_id,
      'target_task_title', v_target_task.title,
      'target_task_completed_at', v_target_task.completed_at
    )
  ) ON CONFLICT (commitment_id, event_type) DO NOTHING;

  -- Record completed session row for unified history
  INSERT INTO public.accountability_verification_sessions (
    commitment_id,
    user_id,
    started_at,
    ended_at,
    required_duration_seconds,
    actual_duration_seconds,
    status,
    evidence_note,
    verification_metadata
  ) VALUES (
    p_commitment_id,
    v_user_id,
    v_now,
    v_now,
    0,
    0,
    'completed',
    'Verified completion of task: ' || v_target_task.title,
    jsonb_build_object(
      'verification_type', 'task_completion',
      'target_task_id', p_target_task_id,
      'verified_objectively', true
    )
  ) RETURNING * INTO v_session;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'FULFILLED',
    'verification_type', 'task_completion',
    'target_task_id', p_target_task_id,
    'data', to_jsonb(v_session)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.fulfill_task_completion_commitment(UUID, UUID) TO authenticated;

-- ----------------------------------------------------------------
-- 4. Hardened State Machine Transition Invariants on task_accountability_commitments
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_commitment_status_transitions()
RETURNS TRIGGER AS $$
BEGIN
  -- If status is changing, enforce legal state machine transitions
  IF (TG_OP = 'UPDATE' AND OLD.commitment_status IS DISTINCT FROM NEW.commitment_status) THEN
    -- Rule 1: committed can only transition to activated
    IF (OLD.commitment_status = 'committed' AND NEW.commitment_status NOT IN ('activated')) THEN
      RAISE EXCEPTION 'Invalid status transition: commitment cannot transition directly from "%" to "%". Must be activated first.',
        OLD.commitment_status, NEW.commitment_status USING ERRCODE = 'P0001';
    END IF;

    -- Rule 2: activated can only transition to fulfilled or waived
    IF (OLD.commitment_status = 'activated' AND NEW.commitment_status NOT IN ('fulfilled', 'waived')) THEN
      RAISE EXCEPTION 'Invalid status transition: activated commitment cannot transition to "%".',
        NEW.commitment_status USING ERRCODE = 'P0001';
    END IF;

    -- Rule 3: fulfilled is a terminal state (cannot transition to activated, waived, or committed)
    IF (OLD.commitment_status = 'fulfilled') THEN
      RAISE EXCEPTION 'Invalid status transition: fulfilled commitment is terminal and cannot be modified.'
        USING ERRCODE = 'P0001';
    END IF;

    -- Rule 4: waived is a terminal state (cannot transition to activated, fulfilled, or committed)
    IF (OLD.commitment_status = 'waived') THEN
      RAISE EXCEPTION 'Invalid status transition: waived commitment is terminal and cannot be modified.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_commitment_status_transitions ON public.task_accountability_commitments;
CREATE TRIGGER trg_enforce_commitment_status_transitions
  BEFORE UPDATE ON public.task_accountability_commitments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_commitment_status_transitions();

-- ----------------------------------------------------------------
-- 5. Table-Level Defense-in-Depth Trigger on accountability_waivers (Quota <= 3)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_weekly_waiver_quota_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_existing_waiver_count INT;
BEGIN
  -- Count existing waivers for this user in this calendar week
  SELECT count(*) INTO v_existing_waiver_count
  FROM public.accountability_waivers
  WHERE user_id = NEW.user_id
    AND waiver_week_year = NEW.waiver_week_year
    AND waiver_week_number = NEW.waiver_week_number;

  IF v_existing_waiver_count >= 3 THEN
    RAISE EXCEPTION 'Weekly waiver limit reached (maximum 3 waivers allowed per calendar week)'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_weekly_waiver_quota ON public.accountability_waivers;
CREATE TRIGGER trg_enforce_weekly_waiver_quota
  BEFORE INSERT ON public.accountability_waivers
  FOR EACH ROW EXECUTE FUNCTION public.enforce_weekly_waiver_quota_limit();
