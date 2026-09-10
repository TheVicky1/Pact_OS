-- PACT Phase 5B: Persistent Notification Infrastructure Migration
-- Establishes public.notifications table with strict RLS, idempotency keys, and helper RPCs.

-- 1. Table: public.notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (
    type IN (
      'task_deadline_approaching',
      'task_missed',
      'accountability_activated',
      'verification_required',
      'verification_completed',
      'waiver_reset',
      'weekly_review',
      'system'
    )
  ),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  dismissed_at TIMESTAMPTZ,
  idempotency_key TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_notification_idempotency UNIQUE (user_id, idempotency_key)
);

-- 2. Performance & Query Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON public.notifications(user_id, created_at DESC) 
  WHERE is_read = false AND is_dismissed = false;

CREATE INDEX IF NOT EXISTS idx_notifications_user_recent 
  ON public.notifications(user_id, created_at DESC) 
  WHERE is_dismissed = false;

CREATE INDEX IF NOT EXISTS idx_notifications_idempotency 
  ON public.notifications(user_id, idempotency_key) 
  WHERE idempotency_key IS NOT NULL;

-- 3. Enable Row-Level Security (RLS) & Grant-- Permissions: Allow authenticated client access under RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO postgres;

-- 4. RLS Policies (User Isolation)
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Helper Function: public.create_notification (Idempotent Notification Creation)
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
  v_now TIMESTAMPTZ := transaction_timestamp();
BEGIN
  IF p_user_id IS NULL OR p_title IS NULL OR p_body IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    body,
    action_url,
    idempotency_key,
    metadata,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_body,
    p_action_url,
    p_idempotency_key,
    p_metadata,
    v_now,
    v_now
  )
  ON CONFLICT (user_id, idempotency_key) DO NOTHING
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_notification(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_notification(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO postgres;

-- 6. Update Autonomous Sweeper RPC to emit persistent notifications atomically
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
  p_batch_size := LEAST(GREATEST(p_batch_size, 1), 500);

  PERFORM set_config('pact.lifecycle_internal', 'true', true);
  PERFORM set_config('pact.internal_bypass', 'true', true);

  FOR v_task IN
    SELECT id, user_id, title, status, deadline_at
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

    -- 2. Locate attached commitment
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

      -- Create persistent accountability notification (confidentiality-safe)
      PERFORM public.create_notification(
        v_task.user_id,
        'accountability_activated',
        'Accountability Action Activated',
        'Commitment deadline for "' || v_task.title || '" was missed. Accountability resolution is now required.',
        '/app/accountability',
        'commitment_activated_' || v_commitment.id
      );

      v_activated_count := v_activated_count + 1;
    ELSE
      -- Create standard missed task notification (without commitment)
      PERFORM public.create_notification(
        v_task.user_id,
        'task_missed',
        'Commitment Deadline Missed',
        'Task "' || v_task.title || '" passed its deadline without completion.',
        '/app/tasks',
        'task_missed_' || v_task.id
      );
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

-- 7. Update User-Scoped Sweeper to emit persistent notifications atomically
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
    SELECT id, user_id, title, status, deadline_at
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

      PERFORM public.create_notification(
        v_user_id,
        'accountability_activated',
        'Accountability Action Activated',
        'Commitment deadline for "' || v_task.title || '" was missed. Accountability resolution is now required.',
        '/app/accountability',
        'commitment_activated_' || v_commitment.id
      );

      v_activated_count := v_activated_count + 1;
    ELSE
      PERFORM public.create_notification(
        v_user_id,
        'task_missed',
        'Commitment Deadline Missed',
        'Task "' || v_task.title || '" passed its deadline without completion.',
        '/app/tasks',
        'task_missed_' || v_task.id
      );
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
