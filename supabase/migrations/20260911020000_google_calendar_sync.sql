-- PACT Phase 5C: Google Calendar Bi-Directional Synchronization Schema
-- Creates public.google_calendar_integrations table and adds sync columns to public.calendar_events.

-- 1. Create google_calendar_integrations table for secure server-only token & cursor storage
CREATE TABLE IF NOT EXISTS public.google_calendar_integrations (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scope TEXT,
  calendar_id TEXT NOT NULL DEFAULT 'primary',
  sync_status TEXT NOT NULL DEFAULT 'disconnected' 
    CHECK (sync_status IN ('connected', 'syncing', 'synced', 'error', 'revoked', 'disconnected')),
  sync_token TEXT,
  last_synced_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for google_calendar_integrations
CREATE INDEX IF NOT EXISTS idx_google_cal_sync_status 
  ON public.google_calendar_integrations(sync_status);

-- Enable RLS on google_calendar_integrations
ALTER TABLE public.google_calendar_integrations ENABLE ROW LEVEL SECURITY;

-- Permissions: Allow authenticated client access under RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.google_calendar_integrations TO authenticated;
GRANT ALL ON TABLE public.google_calendar_integrations TO postgres;

-- RLS Policies: Strict authenticated user ownership
DROP POLICY IF EXISTS "Users can view own google calendar integration" ON public.google_calendar_integrations;
CREATE POLICY "Users can view own google calendar integration"
  ON public.google_calendar_integrations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own google calendar integration" ON public.google_calendar_integrations;
CREATE POLICY "Users can create own google calendar integration"
  ON public.google_calendar_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own google calendar integration" ON public.google_calendar_integrations;
CREATE POLICY "Users can update own google calendar integration"
  ON public.google_calendar_integrations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own google calendar integration" ON public.google_calendar_integrations;
CREATE POLICY "Users can delete own google calendar integration"
  ON public.google_calendar_integrations FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Add synchronization columns to public.calendar_events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'calendar_events' AND column_name = 'google_event_id'
  ) THEN
    ALTER TABLE public.calendar_events 
      ADD COLUMN google_event_id TEXT,
      ADD COLUMN google_etag TEXT,
      ADD COLUMN google_calendar_id TEXT DEFAULT 'primary',
      ADD COLUMN is_external BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN last_synced_at TIMESTAMPTZ;
  END IF;
END $$;

-- Partial unique index to guarantee zero duplicate Google event imports per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_events_google_id 
  ON public.calendar_events(user_id, google_event_id) 
  WHERE google_event_id IS NOT NULL;

-- Performance index for synchronized events
CREATE INDEX IF NOT EXISTS idx_calendar_events_sync_status 
  ON public.calendar_events(user_id, is_external, last_synced_at);

-- 3. Sanitized RPC: Get Google Calendar Integration Status (tokens omitted from client projection)
CREATE OR REPLACE FUNCTION public.get_google_calendar_status(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec RECORD;
BEGIN
  -- Strict tenant authorization check
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized integration status access';
  END IF;

  SELECT 
    user_id,
    sync_status,
    calendar_id,
    last_synced_at,
    last_error,
    (refresh_token IS NOT NULL) AS has_refresh_token,
    (token_expires_at > now()) AS is_token_valid,
    created_at,
    updated_at
  INTO v_rec
  FROM public.google_calendar_integrations
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'connected', false,
      'sync_status', 'disconnected',
      'calendar_id', NULL,
      'last_synced_at', NULL,
      'last_error', NULL,
      'has_refresh_token', false,
      'is_token_valid', false
    );
  END IF;

  RETURN jsonb_build_object(
    'connected', (v_rec.sync_status IN ('connected', 'syncing', 'synced')),
    'sync_status', v_rec.sync_status,
    'calendar_id', v_rec.calendar_id,
    'last_synced_at', v_rec.last_synced_at,
    'last_error', v_rec.last_error,
    'has_refresh_token', v_rec.has_refresh_token,
    'is_token_valid', v_rec.is_token_valid
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_google_calendar_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_google_calendar_status(UUID) TO postgres;
