-- Add phone column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE;

-- Add a constraint to ensure phone numbers are in E.164 format
ALTER TABLE public.profiles 
ADD CONSTRAINT phone_format_check 
CHECK (phone IS NULL OR phone ~ '^\+[1-9][0-9]{1,14}$');

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);