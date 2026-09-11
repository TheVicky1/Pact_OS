-- Migration: 20260911050000_user_onboarding.sql
-- Description: Establishes persistent first-run user onboarding state and safe migration for existing users.

-- 1. Add onboarding columns to public.profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (onboarding_status IN ('not_started', 'in_progress', 'completed')),
  ADD COLUMN IF NOT EXISTS onboarding_step INT NOT NULL DEFAULT 1
    CHECK (onboarding_step BETWEEN 1 AND 3),
  ADD COLUMN IF NOT EXISTS onboarding_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_status ON public.profiles(onboarding_status);

-- 2. Safe migration: Mark existing accounts as completed so existing users are not forced through onboarding
UPDATE public.profiles
SET onboarding_status = 'completed',
    onboarding_completed_at = COALESCE(onboarding_completed_at, now())
WHERE onboarding_status = 'not_started'
  AND (
    timezone IS NOT NULL
    OR created_at < now() - INTERVAL '5 seconds'
  );

-- 3. Update handle_new_user trigger function to initialize onboarding fields for new signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    timezone,
    onboarding_status,
    onboarding_step,
    onboarding_data,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC'),
    'not_started',
    1,
    '{}'::jsonb,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
