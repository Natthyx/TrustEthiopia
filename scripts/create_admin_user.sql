-- Script to create an admin user in Supabase
-- This script should be run in the Supabase SQL Editor

-- First, create the admin user in the auth.users table
-- Note: You'll need to replace 'admin@example.com' and 'secure_password' with actual values
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@reviewtrust.com',
  crypt('admin123$', gen_salt('bf')),
  NOW(),
  NULL,
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"role":"admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Then, create the profile entry for the admin user
-- Note: This will be automatically created by the trigger function, but we can also manually create it
-- to ensure it has the correct role. The trigger function should handle this correctly based on
-- the raw_user_meta_data we set above.

-- If for some reason the profile wasn't created automatically, you can manually create it:
-- INSERT INTO public.profiles (id, email, role)
-- SELECT id, email, 'admin' 
-- FROM auth.users 
-- WHERE email = 'admin@example.com'
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Instructions:
-- 1. Replace 'admin@example.com' with the desired admin email
-- 2. Replace 'secure_password' with a strong password
-- 3. Run this script in the Supabase SQL Editor
-- 4. You can then log in as admin using the admin login page