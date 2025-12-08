-- Script to grant admin RLS access to profiles, businesses, and business_documents
-- This should be run in the Supabase SQL Editor

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can ban users" ON profiles;

DROP POLICY IF EXISTS "Admins can view all businesses" ON businesses;
DROP POLICY IF EXISTS "Admins can update any business" ON businesses;
DROP POLICY IF EXISTS "Admins can ban businesses" ON businesses;

DROP POLICY IF EXISTS "Admins can view all business documents" ON business_documents;
DROP POLICY IF EXISTS "Admins can approve/reject business documents" ON business_documents;
DROP POLICY IF EXISTS "Admins can delete business documents" ON business_documents;

-- Create admin policies for profiles table
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Create admin policies for businesses table
CREATE POLICY "Admins can view all businesses" ON businesses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can update any business" ON businesses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );


-- Create admin policies for business_documents table
CREATE POLICY "Admins can view all business documents" ON business_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can update any business document" ON business_documents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );


CREATE POLICY "Admins can delete any business document" ON business_documents
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );
