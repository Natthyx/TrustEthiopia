-- SQL Script to add icon and background color columns to categories table
-- Run this script in your Supabase SQL editor

ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS icon TEXT,
ADD COLUMN IF NOT EXISTS bg_color TEXT;