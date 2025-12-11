-- Add status column to blogs table
-- Status values: 'pending', 'drafted', 'approved', 'withdrawn', 'published'
ALTER TABLE blogs 
ADD COLUMN status TEXT DEFAULT 'drafted' CHECK (status IN ('pending', 'drafted', 'approved', 'withdrawn', 'published'));