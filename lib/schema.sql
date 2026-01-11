-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  instructions JSONB NOT NULL,
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')) NOT NULL,
  servings INTEGER CHECK (servings >= 1 AND servings <= 12),
  language VARCHAR(5) DEFAULT 'es' NOT NULL,
  country VARCHAR(50) DEFAULT 'argentina' NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create recipe_ingredients junction table
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, ingredient_id)
);

-- Create search_leads table
CREATE TABLE IF NOT EXISTS search_leads (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create search_analytics table (for Phase 4)
CREATE TABLE IF NOT EXISTS search_analytics (
  id SERIAL PRIMARY KEY,
  ingredients JSONB NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create admin_users table for backoffice authentication
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX IF NOT EXISTS idx_recipes_language ON recipes(language);
CREATE INDEX IF NOT EXISTS idx_recipes_country ON recipes(country);
CREATE INDEX IF NOT EXISTS idx_search_analytics_timestamp ON search_analytics(timestamp);
