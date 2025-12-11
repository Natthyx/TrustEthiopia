-- 1. Create business_views table
CREATE TABLE IF NOT EXISTS business_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT
);

-- 2. Enable RLS
ALTER TABLE business_views ENABLE ROW LEVEL SECURITY;

-- 3. Allow anyone (even guests) to insert a view
DROP POLICY IF EXISTS "Anyone can record a view" ON business_views;
CREATE POLICY "Anyone can record a view"
ON business_views FOR INSERT
WITH CHECK (true);

-- 4. Only the business owner can read the views
DROP POLICY IF EXISTS "Business owners can read their views" ON business_views;
CREATE POLICY "Business owners can read their views"
ON business_views FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = business_views.business_id
      AND b.business_owner_id = auth.uid()
  )
);

-- 5. Prevent spam: one view per IP per day (UTC)
DROP INDEX IF EXISTS unique_view_per_day;
CREATE UNIQUE INDEX unique_view_per_day
ON business_views (
  business_id,
  COALESCE(ip_address, 'unknown'),
  date_trunc('day', viewed_at AT TIME ZONE 'UTC')
);