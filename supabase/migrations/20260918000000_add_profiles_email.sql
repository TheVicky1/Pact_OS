-- Fix: signup failed with "Database error saving new user".
-- handle_new_user() (redefined in 20260911050000_user_onboarding.sql) inserts into
-- public.profiles (email, ...), but no migration ever added that column.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Backfill existing profiles from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.id
  AND p.email IS NULL;
