-- Drop the old featured_categories table
DROP TABLE IF EXISTS featured_categories;

-- Create featured_subcategories table for admin-controlled featured subcategories
CREATE TABLE IF NOT EXISTS featured_subcategories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_featured_subcategories_subcategory ON featured_subcategories(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_featured_subcategories_active ON featured_subcategories(is_active);

-- Enable RLS
ALTER TABLE featured_subcategories ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to featured subcategories"
  ON featured_subcategories FOR SELECT
  USING (is_active = true);

-- Grant SELECT permission to anon role
GRANT SELECT ON TABLE featured_subcategories TO anon;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_featured_subcategories_updated_at
  BEFORE UPDATE ON featured_subcategories
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();