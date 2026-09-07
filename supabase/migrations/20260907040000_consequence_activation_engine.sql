-- PACT Phase 3 Milestone 3: Authoritative Consequence Activation & Missed-Commitment Resolution Engine Migration
-- Adds activated_at column, accountability_events audit log table, and integrates atomic consequence activation into public.mark_task_missed().

-- 1. Add activated_at column to task_accountability_commitments
ALTER TABLE public.task_accountability_commitments
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;

-- 2. Table: public.accountability_events (Auditable history log for commitment lifecycle transitions)
CREATE TABLE IF NOT EXISTS public.accountability_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  commitment_id UUID NOT NULL REFERENCES public.task_accountability_commitments(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (
    event_type IN ('activated', 'fulfilled', 'waived', 'resolved')
  ),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_commitment_event_type UNIQUE(commitment_id, event_type)
);

-- 3. Performance & Foreign Key Indexes
CREATE INDEX IF NOT EXISTS idx_accountability_events_commitment ON public.accountability_events(commitment_id);
CREATE INDEX IF NOT EXISTS idx_accountability_events_user ON public.accountability_events(user_id);
CREATE INDEX IF NOT EXISTS idx_accountability_events_task ON public.accountability_events(task_id);

-- 4. Enable Row-Level Security (RLS) & Grant Table Privileges
ALTER TABLE public.accountability_events ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.accountability_events TO authenticated;
GRANT SELECT ON TABLE public.accountability_events TO anon;

-- 5. RLS Policy: public.accountability_events (Read-only for authenticated owner)
DROP POLICY IF EXISTS "Users can read own accountability events" ON public.accountability_events;
CREATE POLICY "Users can read own accountability events"
  ON public.accountability_events FOR SELECT
  USING (auth.uid() = user_id);

-- 6. Hardened Trigger: Prevent direct client manipulation of accountability_events
CREATE OR REPLACE FUNCTION public.protect_accountability_events_immutability()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow service_role or internal system execution (pact.internal_bypass = 'true') to insert/manage events
  IF (current_setting('role', true) <> 'service_role' AND current_setting('pact.internal_bypass', true) IS DISTINCT FROM 'true') THEN
    IF (TG_OP = 'INSERT') THEN
      RAISE EXCEPTION 'Direct insertion into accountability_events is prohibited. Events are generated authoritatively by system lifecycle.';
    ELSIF (TG_OP = 'UPDATE') THEN
      RAISE EXCEPTION 'Accountability event logs are append-only and immutable once created.';
    ELSIF (TG_OP = 'DELETE') THEN
      IF EXISTS (SELECT 1 FROM public.task_accountability_commitments WHERE id = OLD.commitment_id) THEN
        RAISE EXCEPTION 'Direct deletion of accountability events is prohibited.';
      END IF;
    END IF;
  END IF;

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_accountability_events ON public.accountability_events;
CREATE TRIGGER protect_accountability_events
  BEFORE INSERT OR UPDATE OR DELETE ON public.accountability_events
  FOR EACH ROW EXECUTE FUNCTION public.protect_accountability_events_immutability();

-- 7. Update Commitment Immutability Trigger to support authoritative internal activation
CREATE OR REPLACE FUNCTION public.protect_accountability_commitment_immutability()
RETURNS TRIGGER AS $$
BEGIN
  -- If invoked by standard client (not service_role and no internal bypass flag), enforce immutability
  IF (current_setting('role', true) <> 'service_role' AND current_setting('pact.internal_bypass', true) IS DISTINCT FROM 'true') THEN
    IF (TG_OP = 'UPDATE') THEN
      IF (
        OLD.consequence_snapshot <> NEW.consequence_snapshot
        OR OLD.source_consequence_id IS DISTINCT FROM NEW.source_consequence_id
        OR OLD.task_id <> NEW.task_id
        OR OLD.user_id <> NEW.user_id
        OR OLD.commitment_status <> NEW.commitment_status
        OR OLD.activated_at IS DISTINCT FROM NEW.activated_at
      ) THEN
        RAISE EXCEPTION 'Accountability commitment snapshot is immutable once created.';
      END IF;
    ELSIF (TG_OP = 'DELETE') THEN
      IF EXISTS (SELECT 1 FROM public.tasks WHERE id = OLD.task_id) THEN
        RAISE EXCEPTION 'Direct deletion of task accountability commitment is prohibited. Delete the parent task to remove commitment.';
      END IF;
    END IF;
  END IF;

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Updated Authoritative RPC Function: public.mark_task_missed(p_task_id UUID)
-- Atomic transition: task status -> 'missed' AND commitment status -> 'activated' AND event log created in ONE transaction.
CREATE OR REPLACE FUNCTION public.mark_task_missed(p_task_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_task public.tasks%ROWTYPE;
  v_commitment public.task_accountability_commitments%ROWTYPE;
  v_now TIMESTAMPTZ := transaction_timestamp();
  v_updated_task public.tasks%ROWTYPE;
  v_activation_occurred BOOLEAN := false;
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

  -- 5. Enable internal bypass flags for atomic task and commitment state mutation
  PERFORM set_config('pact.lifecycle_internal', 'true', true);
  PERFORM set_config('pact.internal_bypass', 'true', true);

  -- 6. Perform atomic task state transition
  UPDATE public.tasks
  SET
    status = 'missed',
    missed_at = v_now,
    updated_at = v_now
  WHERE id = p_task_id AND user_id = v_user_id
  RETURNING * INTO v_updated_task;

  -- 7. Locate & lock Task Accountability Commitment if attached
  SELECT * INTO v_commitment
  FROM public.task_accountability_commitments
  WHERE task_id = p_task_id AND user_id = v_user_id
  FOR UPDATE;

  -- 8. If commitment exists and is in 'committed' status, activate it atomically
  IF FOUND AND v_commitment.commitment_status = 'committed' THEN
    UPDATE public.task_accountability_commitments
    SET
      commitment_status = 'activated',
      activated_at = v_now,
      updated_at = v_now
    WHERE id = v_commitment.id AND user_id = v_user_id;

    -- Record atomic activation event history entry
    INSERT INTO public.accountability_events (
      user_id,
      task_id,
      commitment_id,
      event_type,
      created_at,
      metadata
    ) VALUES (
      v_user_id,
      p_task_id,
      v_commitment.id,
      'activated',
      v_now,
      jsonb_build_object(
        'consequence_type', v_commitment.consequence_snapshot->>'consequence_type',
        'title', v_commitment.consequence_snapshot->>'title'
      )
    )
    ON CONFLICT (commitment_id, event_type) DO NOTHING;

    v_activation_occurred := true;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'SUCCESS',
    'accountability_activated', v_activation_occurred,
    'data', to_jsonb(v_updated_task)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_task_missed(UUID) TO authenticated;
