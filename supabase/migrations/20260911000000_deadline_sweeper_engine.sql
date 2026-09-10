-- PACT Phase 5A: Autonomous Background Deadline Sweeper & Accountability Automation Migration
-- Establishes partial index on task status/deadline and creates authoritative batch sweeping RPCs.

-- 1. Partial index on non-terminal tasks to optimize background deadline sweeps
CREATE INDEX IF NOT EXISTS idx_tasks_status_deadline 
  ON public.tasks(deadline_at, id) 
  WHERE status IN ('pending', 'in_progress');

-- 2. Authoritative Batch Sweeper RPC for Autonomous / Background Execution
-- Scans all users, locks rows with SKIP LOCKED (zero lock contention under concurrent sweepers),
-- transitions expired tasks to 'missed', activates attached commitments, and logs audit events.
CREATE OR REPLACE FUNCTION public.sweep_expired_tasks(p_batch_size INT DEFAULT 50)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := transaction_timestamp();
  v_start_time TIMESTAMPTZ := clock_timestamp();
  v_task RECORD;
  v_commitment public.task_accountability_commitments%ROWTYPE;
  v_processed_count INT := 0;
  v_activated_count INT := 0;
  v_duration_ms INT;
BEGIN
  -- Limit batch size to reasonable bounds (1..500)
  p_batch_size := LEAST(GREATEST(p_batch_size, 1), 500);

  -- Enable internal bypass flags for atomic task and commitment state transitions
  PERFORM set_config('pact.lifecycle_internal', 'true', true);
  PERFORM set_config('pact.internal_bypass', 'true', true);

  -- Loop through eligible expired tasks using FOR UPDATE SKIP LOCKED
  -- This guarantees that concurrent sweepers process disjoint subsets of tasks with zero blocking or deadlock
  FOR v_task IN
    SELECT id, user_id, status, deadline_at
    FROM public.tasks
    WHERE status IN ('pending', 'in_progress')
      AND deadline_at <= v_now
    ORDER BY deadline_at ASC
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  LOOP
    -- 1. Transition task to 'missed' atomically
    UPDATE public.tasks
    SET
      status = 'missed',
      missed_at = v_now,
      updated_at = v_now
    WHERE id = v_task.id;

    v_processed_count := v_processed_count + 1;

    -- 2. Locate & lock attached accountability commitment if present
    SELECT * INTO v_commitment
    FROM public.task_accountability_commitments
    WHERE task_id = v_task.id AND user_id = v_task.user_id
    FOR UPDATE;

    -- 3. If commitment is in 'committed' state, activate it atomically
    IF FOUND AND v_commitment.commitment_status = 'committed' THEN
      UPDATE public.task_accountability_commitments
      SET
        commitment_status = 'activated',
        activated_at = v_now,
        updated_at = v_now
      WHERE id = v_commitment.id;

      -- Record atomic activation in immutable accountability events log
      INSERT INTO public.accountability_events (
        user_id,
        task_id,
        commitment_id,
        event_type,
        created_at,
        metadata
      ) VALUES (
        v_task.user_id,
        v_task.id,
        v_commitment.id,
        'activated',
        v_now,
        jsonb_build_object(
          'consequence_type', v_commitment.consequence_snapshot->>'consequence_type',
          'source', 'autonomous_deadline_sweeper'
        )
      )
      ON CONFLICT (commitment_id, event_type) DO NOTHING;

      v_activated_count := v_activated_count + 1;
    END IF;
  END LOOP;

  v_duration_ms := EXTRACT(MILLISECOND FROM (clock_timestamp() - v_start_time))::INT;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'SWEEP_COMPLETED',
    'processed_count', v_processed_count,
    'activated_count', v_activated_count,
    'batch_size', p_batch_size,
    'duration_ms', v_duration_ms,
    'executed_at', v_now
  );
END;
$$;

-- 3. Authoritative User-Scoped Sweeper RPC
-- Scoped strictly to auth.uid() for authenticated client/server session initialization
CREATE OR REPLACE FUNCTION public.sweep_user_expired_tasks(p_batch_size INT DEFAULT 50)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_now TIMESTAMPTZ := transaction_timestamp();
  v_start_time TIMESTAMPTZ := clock_timestamp();
  v_task RECORD;
  v_commitment public.task_accountability_commitments%ROWTYPE;
  v_processed_count INT := 0;
  v_activated_count INT := 0;
  v_duration_ms INT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'UNAUTHENTICATED',
      'error', 'Authentication required to sweep user tasks.'
    );
  END IF;

  p_batch_size := LEAST(GREATEST(p_batch_size, 1), 500);

  PERFORM set_config('pact.lifecycle_internal', 'true', true);
  PERFORM set_config('pact.internal_bypass', 'true', true);

  FOR v_task IN
    SELECT id, user_id, status, deadline_at
    FROM public.tasks
    WHERE user_id = v_user_id
      AND status IN ('pending', 'in_progress')
      AND deadline_at <= v_now
    ORDER BY deadline_at ASC
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.tasks
    SET
      status = 'missed',
      missed_at = v_now,
      updated_at = v_now
    WHERE id = v_task.id AND user_id = v_user_id;

    v_processed_count := v_processed_count + 1;

    SELECT * INTO v_commitment
    FROM public.task_accountability_commitments
    WHERE task_id = v_task.id AND user_id = v_user_id
    FOR UPDATE;

    IF FOUND AND v_commitment.commitment_status = 'committed' THEN
      UPDATE public.task_accountability_commitments
      SET
        commitment_status = 'activated',
        activated_at = v_now,
        updated_at = v_now
      WHERE id = v_commitment.id AND user_id = v_user_id;

      INSERT INTO public.accountability_events (
        user_id,
        task_id,
        commitment_id,
        event_type,
        created_at,
        metadata
      ) VALUES (
        v_user_id,
        v_task.id,
        v_commitment.id,
        'activated',
        v_now,
        jsonb_build_object(
          'consequence_type', v_commitment.consequence_snapshot->>'consequence_type',
          'source', 'user_session_deadline_sweeper'
        )
      )
      ON CONFLICT (commitment_id, event_type) DO NOTHING;

      v_activated_count := v_activated_count + 1;
    END IF;
  END LOOP;

  v_duration_ms := EXTRACT(MILLISECOND FROM (clock_timestamp() - v_start_time))::INT;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'USER_SWEEP_COMPLETED',
    'processed_count', v_processed_count,
    'activated_count', v_activated_count,
    'batch_size', p_batch_size,
    'duration_ms', v_duration_ms,
    'executed_at', v_now
  );
END;
$$;

-- 4. Permissions:
-- Global sweep is executable by service_role and postgres
REVOKE ALL ON FUNCTION public.sweep_expired_tasks(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sweep_expired_tasks(INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.sweep_expired_tasks(INT) TO postgres;

-- User sweep is executable by authenticated users (scoped to their own user_id)
GRANT EXECUTE ON FUNCTION public.sweep_user_expired_tasks(INT) TO authenticated;
