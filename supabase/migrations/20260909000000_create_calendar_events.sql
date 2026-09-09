-- PACT Phase 4E: Daily Calendar & Day Planner Schema
-- Creates public.calendar_events table with strict user isolation, server-verified ownership, and temporal constraints.

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0 AND char_length(title) <= 255),
  description TEXT CHECK (char_length(description) <= 2000),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  color_tag TEXT NOT NULL DEFAULT 'gold' CHECK (color_tag IN ('gold', 'blue', 'purple', 'emerald', 'amber', 'rose')),
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_calendar_event_end_after_start CHECK (end_time > start_time)
);

-- Foreign Key & Performance Range Indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_timerange ON public.calendar_events(user_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_task_id ON public.calendar_events(task_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_project_id ON public.calendar_events(project_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_goal_id ON public.calendar_events(goal_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.calendar_events TO authenticated;

-- RLS Policies: Strict authenticated user ownership
DROP POLICY IF EXISTS "Users can read own calendar events" ON public.calendar_events;
CREATE POLICY "Users can read own calendar events"
  ON public.calendar_events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own calendar events" ON public.calendar_events;
CREATE POLICY "Users can create own calendar events"
  ON public.calendar_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own calendar events" ON public.calendar_events;
CREATE POLICY "Users can update own calendar events"
  ON public.calendar_events FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own calendar events" ON public.calendar_events;
CREATE POLICY "Users can delete own calendar events"
  ON public.calendar_events FOR DELETE
  USING (auth.uid() = user_id);
