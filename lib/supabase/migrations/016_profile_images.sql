-- Migration: Add profile image support
-- This script adds profile image functionality to the profiles table and sets up storage

-- 1. Add profile_image_url column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- 2. Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile_images', 'profile_images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Create RLS policies for profile_images storage bucket

-- Allow users to insert their own profile image
CREATE POLICY "Users can upload their profile image"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile_images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own profile image
CREATE POLICY "Users can update their profile image"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'profile_images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their profile image
CREATE POLICY "Users can delete their profile image"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'profile_images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to profile images
CREATE POLICY "Public can read profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile_images');
