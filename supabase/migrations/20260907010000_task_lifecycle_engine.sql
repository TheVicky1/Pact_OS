-- PACT Phase 2F: Authoritative Task Lifecycle & Missed Transition Engine Migration
-- Establishes server-authoritative RPC functions and hardens trigger protections against direct status/timestamp manipulation.

-- 1. Hardened Trigger Function: Enforce trusted lifecycle fields and status mutation rules on tasks
CREATE OR REPLACE FUNCTION public.enforce_task_trusted_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service_role or internal lifecycle RPC executions (which set pact.lifecycle_internal = 'true') to bypass
  IF (current_setting('role', true) <> 'service_role' AND current_setting('pact.lifecycle_internal', true) IS DISTINCT FROM 'true') THEN
    IF (TG_OP = 'INSERT') THEN
      IF (NEW.completed_at IS NOT NULL) THEN
        RAISE EXCEPTION 'Field completed_at is a trusted server-controlled field and cannot be set directly on INSERT.';
      END IF;
      IF (NEW.missed_at IS NOT NULL) THEN
        RAISE EXCEPTION 'Field missed_at is a trusted server-controlled field and cannot be set directly on INSERT.';
      END IF;
      IF (NEW.status IN ('completed', 'missed')) THEN
        RAISE EXCEPTION 'Task status % cannot be set directly on INSERT. Use authoritative lifecycle functions.', NEW.status;
      END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
      IF (NEW.completed_at IS DISTINCT FROM OLD.completed_at) THEN
        RAISE EXCEPTION 'Field completed_at is a trusted server-controlled field and cannot be updated directly.';
      END IF;
      IF (NEW.missed_at IS DISTINCT FROM OLD.missed_at) THEN
        RAISE EXCEPTION 'Field missed_at is a trusted server-controlled field and cannot be updated directly.';
      END IF;
      IF (NEW.status IN ('completed', 'missed') AND NEW.status IS DISTINCT FROM OLD.status) THEN
        RAISE EXCEPTION 'Direct status mutation to % is prohibited. Use authoritative completion or missed transition functions.', NEW.status;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_task_trusted_fields ON public.tasks;
CREATE TRIGGER protect_task_trusted_fields
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.enforce_task_trusted_fields();

-- 2. RPC Function: public.complete_task(p_task_id UUID)
-- Authoritative completion procedure with row-level locking, ownership verification, and deadline evaluation.
CREATE OR REPLACE FUNCTION public.complete_task(p_task_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_task public.tasks%ROWTYPE;
  v_now TIMESTAMPTZ := transaction_timestamp();
  v_updated_task public.tasks%ROWTYPE;
BEGIN
  -- 1. Identify authenticated caller
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'UNAUTHENTICATED',
      'error', 'Authentication required to complete a task.'
    );
  END IF;

  -- 2. Locate & lock Task row for update to prevent concurrent race conditions
  SELECT * INTO v_task
  FROM public.tasks
  WHERE id = p_task_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'NOT_FOUND',
      'error', 'Task not found or access denied.'
    );
  END IF;

  -- 3. Evaluate existing lifecycle status invariants
  IF v_task.status = 'completed' AND v_task.completed_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ALREADY_COMPLETED',
      'error', 'Task has already been completed.',
      'data', to_jsonb(v_task)
    );
  END IF;

  IF v_task.status = 'missed' OR v_task.missed_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ALREADY_MISSED',
      'error', 'Task deadline was missed and cannot be completed.',
      'data', to_jsonb(v_task)
    );
  END IF;

  IF v_task.status = 'archived' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'TASK_ARCHIVED',
      'error', 'Archived tasks cannot participate in execution lifecycle transitions.',
      'data', to_jsonb(v_task)
    );
  END IF;

  -- 4. Evaluate deadline instant (Phase 2E temporal contract: v_now >= deadline_at means deadline reached)
  IF v_now >= v_task.deadline_at THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'DEADLINE_REACHED',
      'error', 'Deadline has passed. Completion is no longer permitted for this commitment.',
      'data', to_jsonb(v_task)
    );
  END IF;

  -- 5. Perform atomic state transition with internal lifecycle bypass flag enabled
  PERFORM set_config('pact.lifecycle_internal', 'true', true);

  UPDATE public.tasks
  SET
    status = 'completed',
    completed_at = v_now,
    updated_at = v_now
  WHERE id = p_task_id AND user_id = v_user_id
  RETURNING * INTO v_updated_task;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'SUCCESS',
    'data', to_jsonb(v_updated_task)
  );
END;
$$;

-- 3. RPC Function: public.mark_task_missed(p_task_id UUID)
-- Authoritative missed transition procedure with row-level locking, ownership verification, and deadline evaluation.
CREATE OR REPLACE FUNCTION public.mark_task_missed(p_task_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_task public.tasks%ROWTYPE;
  v_now TIMESTAMPTZ := transaction_timestamp();
  v_updated_task public.tasks%ROWTYPE;
BEGIN
  -- 1. Identify authenticated caller
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'UNAUTHENTICATED',
      'error', 'Authentication required to transition a task to missed.'
    );
  END IF;

  -- 2. Locate & lock Task row for update to prevent concurrent race conditions
  SELECT * INTO v_task
  FROM public.tasks
  WHERE id = p_task_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'NOT_FOUND',
      'error', 'Task not found or access denied.'
    );
  END IF;

  -- 3. Evaluate existing lifecycle status invariants
  IF v_task.status = 'missed' AND v_task.missed_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ALREADY_MISSED',
      'error', 'Task is already marked as missed.',
      'data', to_jsonb(v_task)
    );
  END IF;

  IF v_task.status = 'completed' OR v_task.completed_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ALREADY_COMPLETED',
      'error', 'Task was completed prior to deadline and cannot be marked missed.',
      'data', to_jsonb(v_task)
    );
  END IF;

  IF v_task.status = 'archived' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'TASK_ARCHIVED',
      'error', 'Archived tasks cannot participate in execution lifecycle transitions.',
      'data', to_jsonb(v_task)
    );
  END IF;

  -- 4. Evaluate deadline instant (Phase 2E temporal contract: v_now < deadline_at means not expired)
  IF v_now < v_task.deadline_at THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'NOT_EXPIRED',
      'error', 'Task deadline has not been reached yet.',
      'data', to_jsonb(v_task)
    );
  END IF;

  -- 5. Perform atomic state transition with internal lifecycle bypass flag enabled
  PERFORM set_config('pact.lifecycle_internal', 'true', true);

  UPDATE public.tasks
  SET
    status = 'missed',
    missed_at = v_now,
    updated_at = v_now
  WHERE id = p_task_id AND user_id = v_user_id
  RETURNING * INTO v_updated_task;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'SUCCESS',
    'data', to_jsonb(v_updated_task)
  );
END;
$$;

-- 4. Grant execution permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.complete_task(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_task_missed(UUID) TO authenticated;
