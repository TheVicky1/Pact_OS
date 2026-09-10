-- PACT Phase 4I-2: Finance & Expense Management Schema
-- Creates finance_categories and finance_transactions tables with integer cents, user isolation, and RLS.

CREATE TABLE IF NOT EXISTS public.finance_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0 AND char_length(name) <= 64),
  color_tag TEXT NOT NULL DEFAULT 'gold' CHECK (color_tag IN ('gold', 'blue', 'purple', 'emerald', 'amber', 'rose', 'cyan', 'slate')),
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_categories_user_id ON public.finance_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_categories_user_archived ON public.finance_categories(user_id, is_archived);

ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.finance_categories TO authenticated;

DROP POLICY IF EXISTS "Users can read own finance categories" ON public.finance_categories;
CREATE POLICY "Users can read own finance categories"
  ON public.finance_categories FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own finance categories" ON public.finance_categories;
CREATE POLICY "Users can create own finance categories"
  ON public.finance_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own finance categories" ON public.finance_categories;
CREATE POLICY "Users can update own finance categories"
  ON public.finance_categories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own finance categories" ON public.finance_categories;
CREATE POLICY "Users can delete own finance categories"
  ON public.finance_categories FOR DELETE
  USING (auth.uid() = user_id);


CREATE TABLE IF NOT EXISTS public.finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.finance_categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  description TEXT NOT NULL CHECK (char_length(trim(description)) > 0 AND char_length(description) <= 255),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_user_id ON public.finance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_user_date ON public.finance_transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_user_type ON public.finance_transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_category_id ON public.finance_transactions(category_id);

ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.finance_transactions TO authenticated;

DROP POLICY IF EXISTS "Users can read own finance transactions" ON public.finance_transactions;
CREATE POLICY "Users can read own finance transactions"
  ON public.finance_transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own finance transactions" ON public.finance_transactions;
CREATE POLICY "Users can create own finance transactions"
  ON public.finance_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own finance transactions" ON public.finance_transactions;
CREATE POLICY "Users can update own finance transactions"
  ON public.finance_transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own finance transactions" ON public.finance_transactions;
CREATE POLICY "Users can delete own finance transactions"
  ON public.finance_transactions FOR DELETE
  USING (auth.uid() = user_id);
