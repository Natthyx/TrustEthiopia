-- Final RLS fix script for ReviewTrust
-- This should be run in the Supabase SQL Editor

-- Fix for the specific error: permission denied for table users
-- This happens when trying to access auth.users table directly
-- We need to grant appropriate permissions

-- Grant usage on auth schema to authenticated users
GRANT USAGE ON SCHEMA auth TO authenticated;

-- Grant select on auth.users to authenticated users
-- This is needed for our admin policy to work
GRANT SELECT ON TABLE auth.users TO authenticated;

-- Now fix the profiles table policies

-- First, drop any problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Recreate the base profiles policies with proper ordering

-- 1. Drop existing profiles policies
DROP POLICY IF EXISTS "Profiles are viewable by themselves" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

-- 2. Recreate base profiles policies
CREATE POLICY "Profiles are viewable by themselves" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 3. Add admin policy that checks auth.users directly (avoiding recursion)
-- This policy allows admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 4. Service role policy for automatic profile creation
CREATE POLICY "Service role can insert profiles" ON profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Make sure RLS is enabled on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Also ensure RLS is enabled on all other tables (should already be enabled but just to be safe)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reviews ENABLE ROW LEVEL SECURITY;

-- Note: Run this script in your Supabase SQL Editor to fix RLS issues
-- After running this script, restart your development server and try logging in again