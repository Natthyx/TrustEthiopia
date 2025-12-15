-- Create best_in_categories table for admin-controlled featured businesses
CREATE TABLE IF NOT EXISTS best_in_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_name VARCHAR(255) NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  business_url VARCHAR(255),
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0,
  logo_text VARCHAR(10),
  background_color VARCHAR(50) DEFAULT 'bg-gray-100',
  text_color VARCHAR(50) DEFAULT 'text-black',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_best_in_categories_category ON best_in_categories(category_name);
CREATE INDEX IF NOT EXISTS idx_best_in_categories_active ON best_in_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_best_in_categories_sort ON best_in_categories(sort_order);

-- Enable RLS
ALTER TABLE best_in_categories ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to best in categories"
  ON best_in_categories FOR SELECT
  USING (is_active = true);

-- Grant SELECT permission to anon role
GRANT SELECT ON TABLE best_in_categories TO anon;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_best_in_categories_updated_at
  BEFORE UPDATE ON best_in_categories
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();