-- PACT Phase 3 Milestone 2: Commitment Assignment & Immutability Engine Migration
-- Establishes task_accountability_commitments table, consequence_snapshot structure, multi-default priority ordering, and strict DB immutability triggers.

-- 1. Add priority column to consequence_definitions for multi-default ranking
ALTER TABLE public.consequence_definitions
  ADD COLUMN IF NOT EXISTS priority INT NOT NULL DEFAULT 0;

-- 2. Table: public.task_accountability_commitments
CREATE TABLE IF NOT EXISTS public.task_accountability_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID UNIQUE NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_consequence_id UUID REFERENCES public.consequence_definitions(id) ON DELETE SET NULL,
  consequence_snapshot JSONB NOT NULL,
  commitment_status TEXT NOT NULL DEFAULT 'committed' CHECK (
    commitment_status IN ('committed', 'activated', 'fulfilled', 'waived')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Performance & Foreign Key Indexes
CREATE INDEX IF NOT EXISTS idx_task_commitments_task_id ON public.task_accountability_commitments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_commitments_user_id ON public.task_accountability_commitments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_commitments_user_status ON public.task_accountability_commitments(user_id, commitment_status);
CREATE INDEX IF NOT EXISTS idx_consequence_defs_priority ON public.consequence_definitions(user_id, priority DESC, is_default, is_enabled);

-- 4. Enable Row-Level Security (RLS) & Grant Table Privileges
ALTER TABLE public.task_accountability_commitments ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.task_accountability_commitments TO authenticated;
GRANT SELECT ON TABLE public.task_accountability_commitments TO anon;

-- 5. RLS Policies: public.task_accountability_commitments
DROP POLICY IF EXISTS "Users can read own task commitments" ON public.task_accountability_commitments;
CREATE POLICY "Users can read own task commitments"
  ON public.task_accountability_commitments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own task commitments" ON public.task_accountability_commitments;
CREATE POLICY "Users can create own task commitments"
  ON public.task_accountability_commitments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.user_id = auth.uid()
    )
    AND (
      source_consequence_id IS NULL OR EXISTS (
        SELECT 1 FROM public.consequence_definitions cd WHERE cd.id = source_consequence_id AND cd.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can update own task commitments" ON public.task_accountability_commitments;
CREATE POLICY "Users can update own task commitments"
  ON public.task_accountability_commitments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own task commitments" ON public.task_accountability_commitments;
CREATE POLICY "Users can delete own task commitments"
  ON public.task_accountability_commitments FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Trigger for updated_at timestamps
CREATE OR REPLACE TRIGGER set_task_accountability_commitments_updated_at
  BEFORE UPDATE ON public.task_accountability_commitments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Hardened DB Trigger for Commitment Immutability & Direct Deletion Protection
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

DROP TRIGGER IF EXISTS enforce_commitment_immutability ON public.task_accountability_commitments;
CREATE TRIGGER enforce_commitment_immutability
  BEFORE UPDATE OR DELETE ON public.task_accountability_commitments
  FOR EACH ROW EXECUTE FUNCTION public.protect_accountability_commitment_immutability();
