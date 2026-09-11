-- Migration: 20260911060000_production_hardening_and_cron_schedule.sql
-- Description: Adds production performance composite indexes and pg_cron integration hooks for autonomous execution.

-- 1. Composite Performance Indexes for High-Frequency Read & Sweeper Queries
CREATE INDEX IF NOT EXISTS idx_tasks_user_status_deadline
  ON public.tasks(user_id, status, deadline_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
  ON public.notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_finance_tx_user_date
  ON public.finance_transactions(user_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_finance_recurring_user_status
  ON public.finance_recurring_transactions(user_id, status, next_occurrence);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_start
  ON public.calendar_events(user_id, start_time);

CREATE INDEX IF NOT EXISTS idx_proof_evidence_user_provider
  ON public.external_proof_evidence(user_id, provider, event_timestamp DESC);

-- 2. Unified Background Engine RPC for Direct Database Cron Invocations
CREATE OR REPLACE FUNCTION public.execute_pact_background_maintenance(p_batch_size INT DEFAULT 100)
RETURNS JSONB AS $$
DECLARE
  v_sweep_result JSONB;
  v_recurring_count INT;
  v_started_at TIMESTAMPTZ := clock_timestamp();
  v_duration_ms NUMERIC;
BEGIN
  -- 1. Sweep expired tasks and activate commitments
  v_sweep_result := public.sweep_expired_tasks(p_batch_size);

  -- 2. Generate due recurring finance occurrences
  v_recurring_count := public.generate_due_recurring_transactions();

  v_duration_ms := ROUND((EXTRACT(EPOCH FROM (clock_timestamp() - v_started_at)) * 1000)::numeric, 2);

  RETURN jsonb_build_object(
    'success', true,
    'sweep', v_sweep_result,
    'recurring_generated_count', v_recurring_count,
    'duration_ms', v_duration_ms,
    'executed_at', now()
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'executed_at', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.execute_pact_background_maintenance(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.execute_pact_background_maintenance(INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.execute_pact_background_maintenance(INT) TO postgres;
