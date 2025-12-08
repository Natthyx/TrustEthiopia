-- Script to fix RLS policy for admin access to profiles
-- This should be run in the Supabase SQL Editor

-- First, drop the problematic policy if it exists
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Add a correct policy allowing admins to view all profiles
-- This avoids recursion by checking the role directly in auth.users table
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Note: Run this script in your Supabase SQL Editor to fix the infinite recursion issue
-- where admins couldn't see all profiles in the admin panel