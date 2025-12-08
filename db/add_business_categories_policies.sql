-- Add RLS policies for business_categories table
-- These policies allow business owners to manage their own business categories

-- Enable RLS if not already enabled
ALTER TABLE business_categories ENABLE ROW LEVEL SECURITY;

-- Business categories policies
CREATE POLICY "Business categories are viewable by everyone" ON business_categories
  FOR SELECT USING (true);

CREATE POLICY "Business owners can insert their own business categories" ON business_categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_categories.business_id 
      AND businesses.business_owner_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can delete their own business categories" ON business_categories
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_categories.business_id 
      AND businesses.business_owner_id = auth.uid()
    )
  );

-- Enable RLS if not already enabled for business_subcategories
ALTER TABLE business_subcategories ENABLE ROW LEVEL SECURITY;

-- Business subcategories policies
CREATE POLICY "Business subcategories are viewable by everyone" ON business_subcategories
  FOR SELECT USING (true);

CREATE POLICY "Business owners can insert their own business subcategories" ON business_subcategories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_subcategories.business_id 
      AND businesses.business_owner_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can delete their own business subcategories" ON business_subcategories
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_subcategories.business_id 
      AND businesses.business_owner_id = auth.uid()
    )
  );