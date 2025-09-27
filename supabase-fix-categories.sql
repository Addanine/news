-- ================================================
-- FIX CATEGORIES ENUM
-- ================================================
-- This fixes the category_type enum to match the app
-- Run this after the main schema
-- ================================================

-- Drop the old enum and recreate with correct values
ALTER TYPE category_type RENAME TO category_type_old;

CREATE TYPE category_type AS ENUM (
  'science-innovation',
  'environment',
  'community',
  'kindness',
  'health-recovery',
  'education',
  'global-progress',
  'technology'
);

-- Update the user_preferences table to use the new enum
ALTER TABLE user_preferences 
  ALTER COLUMN selected_categories DROP DEFAULT;

ALTER TABLE user_preferences 
  ALTER COLUMN selected_categories TYPE category_type[] 
  USING selected_categories::text::category_type[];

ALTER TABLE user_preferences 
  ALTER COLUMN selected_categories SET DEFAULT ARRAY[
    'science-innovation', 
    'environment', 
    'community', 
    'kindness', 
    'health-recovery', 
    'education', 
    'global-progress', 
    'technology'
  ]::category_type[];

-- Update the articles table if it uses categories
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'articles' AND column_name = 'categories'
  ) THEN
    ALTER TABLE articles 
      ALTER COLUMN categories TYPE category_type[] 
      USING categories::text::category_type[];
  END IF;
END $$;

-- Update the categories_config table
ALTER TABLE categories_config 
  ALTER COLUMN id TYPE category_type 
  USING id::text::category_type;

-- Drop the old enum
DROP TYPE category_type_old;

-- Update the seed data in categories_config
DELETE FROM categories_config WHERE id = 'innovation';

INSERT INTO categories_config (id, label, icon, color, keywords, description, display_order) VALUES
  ('technology', 'Technology', '💻', '#A855F7', ARRAY['technology', 'innovation', 'ai', 'artificial intelligence', 'startup', 'app', 'digital', 'software'], 'Innovative technology and digital solutions', 8)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  keywords = EXCLUDED.keywords,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

-- Update any existing user preferences that have 'innovation' to 'technology'
UPDATE user_preferences 
SET selected_categories = array_replace(selected_categories::text[], 'innovation', 'technology')::category_type[]
WHERE 'innovation' = ANY(selected_categories::text[]);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Categories enum fixed successfully!';
  RAISE NOTICE 'Category "innovation" has been replaced with "technology"';
END $$;