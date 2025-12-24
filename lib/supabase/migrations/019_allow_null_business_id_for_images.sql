-- Allow NULL business_id for temporary admin-uploaded images
ALTER TABLE business_images 
ALTER COLUMN business_id DROP NOT NULL;