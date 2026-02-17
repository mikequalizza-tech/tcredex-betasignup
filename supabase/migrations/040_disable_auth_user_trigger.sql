-- Migration: Disable conflicting auth.users trigger
-- The handle_new_user trigger conflicts with manual user creation in signup flow
-- The signup code handles user/org creation manually in steps:
-- 1. Creates auth user via supabase.auth.signUp()
-- 2. Creates organization record in sponsors/cdes/investors table
-- 3. Creates user record in public.users table
--
-- The trigger was trying to insert into profiles table before step 2-3 complete,
-- causing "Database error saving new user" errors.

-- Drop the trigger that fires on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Optionally drop the function (safe since trigger is the only user)
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Note: The profiles table remains available if needed for other purposes,
-- but it's no longer auto-populated on signup.
