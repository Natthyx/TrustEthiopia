-- Add storage policies for blog_thumbnail bucket
-- Allow businesses to upload thumbnails for their blog posts

-- Enable RLS on storage.objects (if not already enabled)
-- Note: This is typically already enabled in Supabase

-- Policy to allow businesses to insert blog thumbnails
CREATE POLICY "Businesses can upload blog thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'blog_thumbnail' 
  AND (storage.foldername(name))[1] = (
    SELECT id::text FROM businesses 
    WHERE business_owner_id = auth.uid()
  )
);

-- Policy to allow businesses to select their own blog thumbnails
CREATE POLICY "Businesses can view their own blog thumbnails"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'blog_thumbnail' 
  AND (storage.foldername(name))[1] = (
    SELECT id::text FROM businesses 
    WHERE business_owner_id = auth.uid()
  )
);

-- Policy to allow businesses to update their own blog thumbnails
CREATE POLICY "Businesses can update their own blog thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'blog_thumbnail' 
  AND (storage.foldername(name))[1] = (
    SELECT id::text FROM businesses 
    WHERE business_owner_id = auth.uid()
  )
);

-- Policy to allow businesses to delete their own blog thumbnails
CREATE POLICY "Businesses can delete their own blog thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'blog_thumbnail' 
  AND (storage.foldername(name))[1] = (
    SELECT id::text FROM businesses 
    WHERE business_owner_id = auth.uid()
  )
);

-- Policy to allow public read access to blog thumbnails (for displaying on blog pages)
CREATE POLICY "Public can read blog thumbnails"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'blog_thumbnail');