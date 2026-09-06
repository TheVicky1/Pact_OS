-- PACT Phase 2A: Core Domain Schema & RLS Security Migration
-- Establishes secure relational tables for Goals, Projects, and Tasks with strict user isolation and cross-user reference prevention.

-- 1. Table: public.goals
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table: public.projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  color_accent TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Table: public.tasks (Commitments)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'missed', 'archived')),
  deadline_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  missed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Foreign Key & Performance Indexes
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON public.goals(user_id, status);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_goal_id ON public.projects(goal_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_status ON public.projects(user_id, status);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_goal_id ON public.tasks(goal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_deadline ON public.tasks(user_id, deadline_at);

-- 5. Row Level Security (RLS) Enablement
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies: public.goals
CREATE POLICY "Users can read own goals"
  ON public.goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own goals"
  ON public.goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON public.goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON public.goals FOR DELETE
  USING (auth.uid() = user_id);

-- 7. RLS Policies: public.projects (Includes Cross-User Parent Goal Isolation)
CREATE POLICY "Users can read own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON public.projects FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      goal_id IS NULL OR EXISTS (
        SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      goal_id IS NULL OR EXISTS (
        SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- 8. RLS Policies: public.tasks (Includes Cross-User Parent Goal & Project Isolation)
CREATE POLICY "Users can read own tasks"
  ON public.tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      goal_id IS NULL OR EXISTS (
        SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.user_id = auth.uid()
      )
    )
    AND (
      project_id IS NULL OR EXISTS (
        SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update own tasks"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      goal_id IS NULL OR EXISTS (
        SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.user_id = auth.uid()
      )
    )
    AND (
      project_id IS NULL OR EXISTS (
        SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete own tasks"
  ON public.tasks FOR DELETE
  USING (auth.uid() = user_id);

-- 9. Trigger Function: Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER set_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Trigger Function: Enforce trusted lifecycle fields on tasks
-- Prevents standard authenticated client UPDATE statements from setting or modifying completed_at or missed_at
CREATE OR REPLACE FUNCTION public.enforce_task_trusted_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If invoked by standard authenticated user role (not service_role), enforce field immutability
  IF (current_setting('role', true) <> 'service_role') THEN
    IF (TG_OP = 'INSERT') THEN
      IF (NEW.completed_at IS NOT NULL) THEN
        RAISE EXCEPTION 'Field completed_at is a trusted server-controlled field and cannot be set directly on INSERT.';
      END IF;
      IF (NEW.missed_at IS NOT NULL) THEN
        RAISE EXCEPTION 'Field missed_at is a trusted server-controlled field and cannot be set directly on INSERT.';
      END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
      IF (NEW.completed_at IS DISTINCT FROM OLD.completed_at) THEN
        RAISE EXCEPTION 'Field completed_at is a trusted server-controlled field and cannot be updated directly.';
      END IF;
      IF (NEW.missed_at IS DISTINCT FROM OLD.missed_at) THEN
        RAISE EXCEPTION 'Field missed_at is a trusted server-controlled field and cannot be updated directly.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_task_trusted_fields ON public.tasks;
CREATE OR REPLACE TRIGGER protect_task_trusted_fields
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.enforce_task_trusted_fields();
