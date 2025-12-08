-- Add icon and background color columns to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS icon TEXT,
ADD COLUMN IF NOT EXISTS bg_color TEXT;

