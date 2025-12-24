-- Add featured and trending columns to blogs table
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT FALSE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blogs_featured ON blogs(is_featured);
CREATE INDEX IF NOT EXISTS idx_blogs_trending ON blogs(is_trending);

-- Update RLS policies to allow admins to manage featured/trending status
-- Add policy for admins to update featured/trending status
CREATE POLICY "Admins manage featured trending blogs" ON blogs
  FOR UPDATE TO service_role
  USING (true)
  WITH CHECK (true);