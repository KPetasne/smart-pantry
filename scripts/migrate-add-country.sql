-- Add country column to existing recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS country VARCHAR(50) DEFAULT 'argentina' NOT NULL;

-- Create index for country filtering
CREATE INDEX IF NOT EXISTS idx_recipes_country ON recipes(country);

-- Delete all existing recipes (starting fresh with new prompts)
TRUNCATE recipes, ingredients, recipe_ingredients CASCADE;
