-- Update category icons to use Lucide React icon names instead of emojis
-- This migration updates existing categories to use the new icon naming system

-- Update existing categories with new icon names
UPDATE public.categories 
SET icon = CASE 
  WHEN icon = '📁' THEN 'folder'
  WHEN icon = '🏥' THEN 'hospital'
  WHEN icon = '🍽️' THEN 'utensils'
  WHEN icon = '🛍️' THEN 'shopping-bag'
  WHEN icon = '💼' THEN 'briefcase'
  WHEN icon = '🎭' THEN 'drama'
  WHEN icon = '🚗' THEN 'car'
  WHEN icon = '🏠' THEN 'home'
  WHEN icon = '💅' THEN 'sparkles'
  WHEN icon = '💪' THEN 'dumbbell'
  WHEN icon = '💻' THEN 'laptop'
  WHEN icon = '✈️' THEN 'plane'
  WHEN icon = '📚' THEN 'book'
  WHEN icon = '💰' THEN 'wallet'
  WHEN icon = '🐾' THEN 'paw-print'
  ELSE icon
END
WHERE icon IS NOT NULL;

-- For any categories that don't have an icon set, set a default
UPDATE public.categories 
SET icon = 'folder'
WHERE icon IS NULL OR icon = '';