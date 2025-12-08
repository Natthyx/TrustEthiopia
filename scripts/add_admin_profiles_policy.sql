-- Script to add RLS policy allowing admins to view all profiles
-- This should be run in the Supabase SQL Editor

-- Add policy allowing admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Note: Run this script in your Supabase SQL Editor to fix the issue
-- where admins could only see their own profile in the admin panel