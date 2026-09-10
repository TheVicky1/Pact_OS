-- PACT Phase 5E: Financial Subscriptions, Recurring Transactions & Budget Discipline Migration
-- Creates finance_recurring_transactions and finance_budgets tables with strict RLS, integer cents, and atomic generator RPCs.

-- 1. Table: public.finance_recurring_transactions
CREATE TABLE IF NOT EXISTS public.finance_recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.finance_categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  description TEXT NOT NULL CHECK (char_length(trim(description)) > 0 AND char_length(description) <= 255),
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  next_occurrence DATE NOT NULL,
  last_generated_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_recurring_user ON public.finance_recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_recurring_due ON public.finance_recurring_transactions(status, next_occurrence) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_finance_recurring_category ON public.finance_recurring_transactions(category_id);

-- Enable RLS on finance_recurring_transactions
ALTER TABLE public.finance_recurring_transactions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.finance_recurring_transactions TO authenticated;
GRANT ALL ON TABLE public.finance_recurring_transactions TO postgres;

DROP POLICY IF EXISTS "Users can read own recurring transactions" ON public.finance_recurring_transactions;
CREATE POLICY "Users can read own recurring transactions"
  ON public.finance_recurring_transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own recurring transactions" ON public.finance_recurring_transactions;
CREATE POLICY "Users can create own recurring transactions"
  ON public.finance_recurring_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own recurring transactions" ON public.finance_recurring_transactions;
CREATE POLICY "Users can update own recurring transactions"
  ON public.finance_recurring_transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own recurring transactions" ON public.finance_recurring_transactions;
CREATE POLICY "Users can delete own recurring transactions"
  ON public.finance_recurring_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Add recurrence linking columns to public.finance_transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'finance_transactions' AND column_name = 'recurring_transaction_id'
  ) THEN
    ALTER TABLE public.finance_transactions 
      ADD COLUMN recurring_transaction_id UUID REFERENCES public.finance_recurring_transactions(id) ON DELETE SET NULL,
      ADD COLUMN occurrence_date DATE;
  END IF;
END $$;

-- Strict idempotency index: one transaction per recurrence per occurrence date
CREATE UNIQUE INDEX IF NOT EXISTS uq_finance_tx_recurrence_occurrence
  ON public.finance_transactions(recurring_transaction_id, occurrence_date)
  WHERE recurring_transaction_id IS NOT NULL;

-- 3. Table: public.finance_budgets (Category-based monthly budgeting)
CREATE TABLE IF NOT EXISTS public.finance_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.finance_categories(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period ~ '^\d{4}-\d{2}$'), -- "YYYY-MM"
  limit_cents BIGINT NOT NULL CHECK (limit_cents > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_category_period UNIQUE (user_id, category_id, period)
);

CREATE INDEX IF NOT EXISTS idx_finance_budgets_user_period ON public.finance_budgets(user_id, period);
CREATE INDEX IF NOT EXISTS idx_finance_budgets_category ON public.finance_budgets(category_id);

-- Enable RLS on finance_budgets
ALTER TABLE public.finance_budgets ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.finance_budgets TO authenticated;
GRANT ALL ON TABLE public.finance_budgets TO postgres;

DROP POLICY IF EXISTS "Users can read own finance budgets" ON public.finance_budgets;
CREATE POLICY "Users can read own finance budgets"
  ON public.finance_budgets FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own finance budgets" ON public.finance_budgets;
CREATE POLICY "Users can create own finance budgets"
  ON public.finance_budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own finance budgets" ON public.finance_budgets;
CREATE POLICY "Users can update own finance budgets"
  ON public.finance_budgets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own finance budgets" ON public.finance_budgets;
CREATE POLICY "Users can delete own finance budgets"
  ON public.finance_budgets FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Extend public.notifications type constraint to include budget & recurrence alerts
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check CHECK (
    type IN (
      'task_deadline_approaching',
      'task_missed',
      'accountability_activated',
      'verification_required',
      'verification_completed',
      'waiver_reset',
      'weekly_review',
      'budget_approaching_limit',
      'budget_exceeded',
      'recurring_transaction_generated',
      'system'
    )
  );

-- 5. Helper function to advance a date by frequency
CREATE OR REPLACE FUNCTION public.calculate_next_occurrence_date(
  p_current_date DATE,
  p_frequency TEXT,
  p_start_date DATE
)
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_next DATE;
  v_orig_day INT;
BEGIN
  v_orig_day := EXTRACT(DAY FROM p_start_date)::INT;

  IF p_frequency = 'weekly' THEN
    v_next := p_current_date + INTERVAL '7 days';
  ELSIF p_frequency = 'biweekly' THEN
    v_next := p_current_date + INTERVAL '14 days';
  ELSIF p_frequency = 'monthly' THEN
    -- Advance month and clamp day
    v_next := (p_current_date + INTERVAL '1 month')::DATE;
    -- If original day was 31, ensure we restore to 31 if target month has 31 days
    IF v_orig_day > EXTRACT(DAY FROM v_next)::INT THEN
      -- Try to set to original day if valid in target month
      BEGIN
        v_next := (date_trunc('month', v_next) + (v_orig_day - 1 || ' days')::INTERVAL)::DATE;
      EXCEPTION WHEN OTHERS THEN
        -- Keep clamped end of month
        v_next := (date_trunc('month', v_next) + INTERVAL '1 month - 1 day')::DATE;
      END;
    END IF;
  ELSIF p_frequency = 'yearly' THEN
    v_next := (p_current_date + INTERVAL '1 year')::DATE;
  ELSE
    v_next := p_current_date + INTERVAL '1 month';
  END IF;

  RETURN v_next;
END;
$$;

-- 6. Authoritative Background Generation RPC: public.generate_due_recurring_transactions
CREATE OR REPLACE FUNCTION public.generate_due_recurring_transactions(p_batch_size INT DEFAULT 50)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_now TIMESTAMPTZ := transaction_timestamp();
  v_rec RECORD;
  v_generated_count INT := 0;
  v_advanced_count INT := 0;
  v_next_date DATE;
BEGIN
  p_batch_size := LEAST(GREATEST(p_batch_size, 1), 500);

  FOR v_rec IN
    SELECT *
    FROM public.finance_recurring_transactions
    WHERE status = 'active'
      AND next_occurrence <= v_today
    ORDER BY next_occurrence ASC
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  LOOP
    -- 1. Insert transaction with idempotency constraint
    INSERT INTO public.finance_transactions (
      user_id,
      category_id,
      type,
      amount_cents,
      description,
      transaction_date,
      recurring_transaction_id,
      occurrence_date,
      created_at,
      updated_at
    ) VALUES (
      v_rec.user_id,
      v_rec.category_id,
      v_rec.type,
      v_rec.amount_cents,
      v_rec.description,
      v_rec.next_occurrence,
      v_rec.id,
      v_rec.next_occurrence,
      v_now,
      v_now
    ) ON CONFLICT (recurring_transaction_id, occurrence_date) DO NOTHING;

    v_generated_count := v_generated_count + 1;

    -- 2. Calculate next occurrence
    v_next_date := public.calculate_next_occurrence_date(v_rec.next_occurrence, v_rec.frequency, v_rec.start_date);

    -- 3. Check if past end_date
    IF v_rec.end_date IS NOT NULL AND v_next_date > v_rec.end_date THEN
      UPDATE public.finance_recurring_transactions
      SET
        last_generated_date = v_rec.next_occurrence,
        status = 'archived',
        updated_at = v_now
      WHERE id = v_rec.id;
    ELSE
      UPDATE public.finance_recurring_transactions
      SET
        last_generated_date = v_rec.next_occurrence,
        next_occurrence = v_next_date,
        updated_at = v_now
      WHERE id = v_rec.id;
    END IF;

    v_advanced_count := v_advanced_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'RECURRING_TRANSACTIONS_PROCESSED',
    'generated_count', v_generated_count,
    'advanced_count', v_advanced_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_due_recurring_transactions(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_due_recurring_transactions(INT) TO postgres;

-- 7. User-scoped generation hook (called on finance page load)
CREATE OR REPLACE FUNCTION public.generate_user_due_recurring_transactions()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_today DATE := CURRENT_DATE;
  v_now TIMESTAMPTZ := transaction_timestamp();
  v_rec RECORD;
  v_generated_count INT := 0;
  v_next_date DATE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthenticated');
  END IF;

  FOR v_rec IN
    SELECT *
    FROM public.finance_recurring_transactions
    WHERE user_id = v_user_id
      AND status = 'active'
      AND next_occurrence <= v_today
    ORDER BY next_occurrence ASC
    LIMIT 50
    FOR UPDATE
  LOOP
    INSERT INTO public.finance_transactions (
      user_id,
      category_id,
      type,
      amount_cents,
      description,
      transaction_date,
      recurring_transaction_id,
      occurrence_date,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_rec.category_id,
      v_rec.type,
      v_rec.amount_cents,
      v_rec.description,
      v_rec.next_occurrence,
      v_rec.id,
      v_rec.next_occurrence,
      v_now,
      v_now
    ) ON CONFLICT (recurring_transaction_id, occurrence_date) DO NOTHING;

    v_generated_count := v_generated_count + 1;

    v_next_date := public.calculate_next_occurrence_date(v_rec.next_occurrence, v_rec.frequency, v_rec.start_date);

    IF v_rec.end_date IS NOT NULL AND v_next_date > v_rec.end_date THEN
      UPDATE public.finance_recurring_transactions
      SET
        last_generated_date = v_rec.next_occurrence,
        status = 'archived',
        updated_at = v_now
      WHERE id = v_rec.id;
    ELSE
      UPDATE public.finance_recurring_transactions
      SET
        last_generated_date = v_rec.next_occurrence,
        next_occurrence = v_next_date,
        updated_at = v_now
      WHERE id = v_rec.id;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'USER_RECURRING_PROCESSED',
    'generated_count', v_generated_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_user_due_recurring_transactions() TO authenticated;
