-- PACT Phase 3 Milestone 1: Accountability Domain Foundation Migration
-- Establishes data structures for reusable Consequence Definitions and User Accountability Preferences with strict RLS and safety boundaries.

-- 1. Table: public.consequence_definitions
CREATE TABLE IF NOT EXISTS public.consequence_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  consequence_type TEXT NOT NULL CHECK (
    consequence_type IN (
      'personal_restriction',
      'extra_responsibility',
      'self_improvement',
      'reflection',
      'financial_declaration',
      'custom'
    )
  ),
  action_statement TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table: public.user_accountability_preferences
CREATE TABLE IF NOT EXISTS public.user_accountability_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  default_consequence_id UUID REFERENCES public.consequence_definitions(id) ON DELETE SET NULL,
  auto_apply_default BOOLEAN NOT NULL DEFAULT false,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Performance & Foreign Key Indexes
CREATE INDEX IF NOT EXISTS idx_consequence_defs_user_id ON public.consequence_definitions(user_id);
CREATE INDEX IF NOT EXISTS idx_consequence_defs_user_enabled ON public.consequence_definitions(user_id, is_enabled);
CREATE INDEX IF NOT EXISTS idx_consequence_defs_user_default ON public.consequence_definitions(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_user_acc_prefs_default_cons ON public.user_accountability_preferences(default_consequence_id);

-- 4. Enable Row-Level Security (RLS) & Grant Table Privileges
ALTER TABLE public.consequence_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_accountability_preferences ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.consequence_definitions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_accountability_preferences TO authenticated;

GRANT SELECT ON TABLE public.consequence_definitions TO anon;
GRANT SELECT ON TABLE public.user_accountability_preferences TO anon;

-- 5. RLS Policies: public.consequence_definitions
DROP POLICY IF EXISTS "Users can read own consequence definitions" ON public.consequence_definitions;
CREATE POLICY "Users can read own consequence definitions"
  ON public.consequence_definitions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own consequence definitions" ON public.consequence_definitions;
CREATE POLICY "Users can create own consequence definitions"
  ON public.consequence_definitions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own consequence definitions" ON public.consequence_definitions;
CREATE POLICY "Users can update own consequence definitions"
  ON public.consequence_definitions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own consequence definitions" ON public.consequence_definitions;
CREATE POLICY "Users can delete own consequence definitions"
  ON public.consequence_definitions FOR DELETE
  USING (auth.uid() = user_id);

-- 6. RLS Policies: public.user_accountability_preferences (Includes Cross-User Default Consequence Isolation)
DROP POLICY IF EXISTS "Users can read own accountability preferences" ON public.user_accountability_preferences;
CREATE POLICY "Users can read own accountability preferences"
  ON public.user_accountability_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own accountability preferences" ON public.user_accountability_preferences;
CREATE POLICY "Users can create own accountability preferences"
  ON public.user_accountability_preferences FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      default_consequence_id IS NULL OR EXISTS (
        SELECT 1 FROM public.consequence_definitions cd WHERE cd.id = default_consequence_id AND cd.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can update own accountability preferences" ON public.user_accountability_preferences;
CREATE POLICY "Users can update own accountability preferences"
  ON public.user_accountability_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      default_consequence_id IS NULL OR EXISTS (
        SELECT 1 FROM public.consequence_definitions cd WHERE cd.id = default_consequence_id AND cd.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can delete own accountability preferences" ON public.user_accountability_preferences;
CREATE POLICY "Users can delete own accountability preferences"
  ON public.user_accountability_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Triggers for updated_at timestamps
CREATE OR REPLACE TRIGGER set_consequence_definitions_updated_at
  BEFORE UPDATE ON public.consequence_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_user_accountability_preferences_updated_at
  BEFORE UPDATE ON public.user_accountability_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
