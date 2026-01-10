-- Add language column to existing recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'es' NOT NULL;

-- Create index for language filtering
CREATE INDEX IF NOT EXISTS idx_recipes_language ON recipes(language);

-- Delete all existing recipes (starting fresh as requested)
TRUNCATE recipes, ingredients, recipe_ingredients CASCADE;
