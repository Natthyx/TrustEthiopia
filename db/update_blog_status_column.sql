-- Add 'unpublished' to the status column constraints
ALTER TABLE blogs 
DROP CONSTRAINT blogs_status_check;

ALTER TABLE blogs 
ADD CONSTRAINT blogs_status_check 
CHECK (status IN ('pending', 'drafted', 'approved', 'withdrawn', 'published', 'unpublished'));

-- Update any existing published=false posts to have status='unpublished' where they were previously published
UPDATE blogs 
SET status = 'unpublished' 
WHERE published = false AND status = 'published';

-- Set default status to 'drafted' for new posts
ALTER TABLE blogs 
ALTER COLUMN status SET DEFAULT 'drafted';