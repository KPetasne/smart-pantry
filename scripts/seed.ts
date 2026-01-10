import { query, execute } from '../lib/db';
import { GeminiService } from '../lib/gemini-service';
import { validateRecipeData } from '../lib/recipe-normalizer';

const TARGET_RECIPES = 20;
const BATCH_SIZE = 2; // Process recipes in batches to avoid overwhelming the API

interface RecipeData {
  title: string;
  ingredients: string[];
  instructions: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  language: string;
  country: string;
}

async function initializeSchema() {
  console.log('Initializing database schema...');
  const schema = `
    -- Create recipes table
    CREATE TABLE IF NOT EXISTS recipes (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      instructions JSONB NOT NULL,
      difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')) NOT NULL,
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

    -- Create search_analytics table
    CREATE TABLE IF NOT EXISTS search_analytics (
      id SERIAL PRIMARY KEY,
      ingredients JSONB NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
    CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);
    CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);
    CREATE INDEX IF NOT EXISTS idx_recipes_language ON recipes(language);
    CREATE INDEX IF NOT EXISTS idx_recipes_country ON recipes(country);
    CREATE INDEX IF NOT EXISTS idx_search_analytics_timestamp ON search_analytics(timestamp);
  `;

  // Execute schema creation statements one by one
  const statements = schema.split(';').filter(s => s.trim().length > 0);
  for (const statement of statements) {
    try {
      await execute(statement);
    } catch (error) {
      // Ignore errors for IF NOT EXISTS statements
      console.warn('Schema statement warning:', error);
    }
  }
  console.log('Schema initialized successfully');
}

async function getOrCreateIngredient(name: string): Promise<number> {
  const normalized = name.trim().toLowerCase();
  
  // Try to find existing ingredient
  const existing = await query<{ id: number }>(
    'SELECT id FROM ingredients WHERE name = $1',
    [normalized]
  );

  if (existing.length > 0) {
    return existing[0].id;
  }

  // Create new ingredient
  const result = await query<{ id: number }>(
    'INSERT INTO ingredients (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
    [normalized]
  );

  return result[0].id;
}

async function insertRecipe(recipe: RecipeData, language: string = 'es', country: string = 'argentina'): Promise<number> {
  // Insert recipe
  const recipeResult = await query<{ id: number }>(
    `INSERT INTO recipes (title, instructions, difficulty, language, country) 
     VALUES ($1, $2::jsonb, $3, $4, $5) 
     RETURNING id`,
    [recipe.title, JSON.stringify(recipe.instructions), recipe.difficulty, language, country]
  );

  const recipeId = recipeResult[0].id;

  // Insert ingredients and relationships
  for (const ingredientName of recipe.ingredients) {
    const ingredientId = await getOrCreateIngredient(ingredientName);
    
    await execute(
      `INSERT INTO recipe_ingredients (recipe_id, ingredient_id) 
       VALUES ($1, $2) 
       ON CONFLICT DO NOTHING`,
      [recipeId, ingredientId]
    );
  }

  return recipeId;
}

async function seedRecipes() {
  console.log(`Starting seed process for ${TARGET_RECIPES} recipes...`);
  
  const geminiService = new GeminiService();
  let successCount = 0;
  let errorCount = 0;

  // Available countries for recipe generation
  const countries = ['argentina', 'mexico', 'spain', 'italy', 'china', 'japan', 'peru', 'usa'] as const;

  // Check how many recipes already exist
  const existing = await query<{ count: string }>('SELECT COUNT(*) as count FROM recipes');
  const existingCount = parseInt(existing[0].count);
  
  if (existingCount >= TARGET_RECIPES) {
    console.log(`Already have ${existingCount} recipes. Target reached.`);
    return;
  }

  const recipesToGenerate = TARGET_RECIPES - existingCount;
  console.log(`Generating ${recipesToGenerate} new recipes from all countries...`);

  for (let i = 0; i < recipesToGenerate; i += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, recipesToGenerate - i);
    const batch = Array.from({ length: batchSize }, (_, idx) => i + idx + 1);

    console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1} (recipes ${i + 1}-${i + batchSize})...`);

    const promises = batch.map(async (recipeNum) => {
      try {
        // Select random country
        const randomCountry = countries[Math.floor(Math.random() * countries.length)];
        
        // Generate recipe with Gemini in Spanish for random country
        const generatedRecipe = await geminiService.generateRecipe(undefined, randomCountry, 'es');
        
        // Validate and normalize
        const validatedRecipe = validateRecipeData(generatedRecipe);
        
        // Insert into database
        const recipeId = await insertRecipe(validatedRecipe, validatedRecipe.language, validatedRecipe.country);
        
        successCount++;
        console.log(`✓ Recipe ${recipeNum}/${recipesToGenerate}: "${validatedRecipe.title}" [${randomCountry.toUpperCase()}] (ID: ${recipeId})`);
        
        return { success: true, recipeNum };
      } catch (error) {
        errorCount++;
        console.error(`✗ Recipe ${recipeNum}/${recipesToGenerate} failed:`, error);
        return { success: false, recipeNum, error };
      }
    });

    await Promise.all(promises);

    // Add a small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < recipesToGenerate) {
      console.log('Waiting 5 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  console.log(`\n=== Seed Complete ===`);
  console.log(`Successfully created: ${successCount} recipes`);
  console.log(`Errors: ${errorCount} recipes`);
  
  // Final count
  const final = await query<{ count: string }>('SELECT COUNT(*) as count FROM recipes');
  console.log(`Total recipes in database: ${final[0].count}`);
}

async function main() {
  try {
    await initializeSchema();
    await seedRecipes();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error during seeding:', error);
    process.exit(1);
  }
}

main();
