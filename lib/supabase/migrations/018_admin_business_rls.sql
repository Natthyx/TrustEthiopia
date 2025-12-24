-- Admin RLS policies for businesses and business images
-- Admins can create businesses and manage businesses they created
-- Admins can manage business images for businesses they created

-- Add a column to track if a business was created by admin
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS created_by_admin BOOLEAN DEFAULT FALSE;

-- Update existing businesses to mark them as not created by admin
UPDATE businesses SET created_by_admin = FALSE WHERE created_by_admin IS NULL;

-- Admins can insert businesses
CREATE POLICY "admins_insert_businesses" ON businesses
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update businesses they created (admin-created businesses where business_owner_id matches admin's ID)
CREATE POLICY "admins_update_own_businesses" ON businesses
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    AND created_by_admin = true
    AND business_owner_id = auth.uid()  -- This is the admin's ID for admin-created businesses
  );

-- Admins can delete businesses they created (admin-created businesses where business_owner_id matches admin's ID)
CREATE POLICY "admins_delete_own_businesses" ON businesses
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    AND created_by_admin = true
    AND business_owner_id = auth.uid()  -- This is the admin's ID for admin-created businesses
  );

-- Admins can insert business images
CREATE POLICY "admins_insert_business_images" ON business_images
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update business images for businesses they created
CREATE POLICY "admins_update_business_images" ON business_images
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    AND (
      -- Allow updates to images for businesses created by admin
      EXISTS (
        SELECT 1 FROM businesses 
        WHERE businesses.id = business_images.business_id
        AND businesses.created_by_admin = true
        AND businesses.business_owner_id = auth.uid()
      )
      OR
      -- Allow updates to images with null business_id (temporarily uploaded by admin)
      business_images.business_id IS NULL
    )
  );

-- Admins can delete business images for businesses they created
CREATE POLICY "admins_delete_business_images" ON business_images
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    AND (
      -- Allow deletion of images for businesses created by admin
      EXISTS (
        SELECT 1 FROM businesses 
        WHERE businesses.id = business_images.business_id
        AND businesses.created_by_admin = true
        AND businesses.business_owner_id = auth.uid()
      )
      OR
      -- Allow deletion of images with null business_id (temporarily uploaded by admin)
      business_images.business_id IS NULL
    )
  );