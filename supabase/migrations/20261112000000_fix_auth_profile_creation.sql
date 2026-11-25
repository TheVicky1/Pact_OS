-- Migration: 20261112000000_fix_auth_profile_creation.sql
-- Description: Fixes Supabase Auth profile creation lifecycle by aligning public.handle_new_user()
-- with the authoritative 9-column public.profiles schema (omitting nonexistent 'email' column),
-- securing search_path, restricting execution privileges strictly to supabase_auth_admin,
-- and ensuring idempotent execution that never resets existing onboarding progress.

-- 1. Define hardened, production-safe handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
  v_timezone TEXT;
BEGIN
  -- Extract and sanitize user full_name from OAuth / Auth user metadata
  v_full_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    ''
  );

  -- Extract and sanitize user timezone from metadata, defaulting safely to 'UTC'
  v_timezone := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'timezone'), ''),
    'UTC'
  );

  -- Insert profile with strictly existing columns.
  -- Safe against duplicate events (ON CONFLICT DO UPDATE):
  -- Preserves existing user's onboarding progress and timestamps.
  INSERT INTO public.profiles (
    id,
    full_name,
    timezone,
    onboarding_status,
    onboarding_step,
    onboarding_data,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    v_full_name,
    v_timezone,
    'not_started',
    1,
    '{}'::jsonb,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    updated_at = now();

  RETURN NEW;
END;
$$;

-- 2. Secure function permissions: revoke execute from PUBLIC and grant strictly to auth admin
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- 3. Recreate auth.users trigger to ensure clean, non-duplicate attachment
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Safe, idempotent backfill: Create profile for any existing auth.users lacking a matching record
INSERT INTO public.profiles (
  id,
  full_name,
  timezone,
  onboarding_status,
  onboarding_step,
  onboarding_data,
  created_at,
  updated_at
)
SELECT
  u.id,
  COALESCE(
    NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(u.raw_user_meta_data->>'name'), ''),
    ''
  ),
  COALESCE(
    NULLIF(TRIM(u.raw_user_meta_data->>'timezone'), ''),
    'UTC'
  ),
  'not_started',
  1,
  '{}'::jsonb,
  u.created_at,
  now()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;
