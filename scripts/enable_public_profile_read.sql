-- Script to enable public read access to profiles for reviewer names
-- This should be run in the Supabase SQL Editor

-- Create policy allowing public users to read profiles
-- This enables showing reviewer names in public reviews
CREATE POLICY "Public can read profiles for reviewer names" ON profiles
  FOR SELECT
  TO anon
  USING (true);

-- Note: Run this script in your Supabase SQL Editor
-- After running this, public users will be able to see reviewer names in reviews