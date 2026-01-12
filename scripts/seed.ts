import 'dotenv/config';
import { query, execute } from '../lib/db';
import { GeminiService } from '../lib/gemini-service';
import { validateRecipeData, type RecipeData } from '../lib/recipe-normalizer';

const DEFAULT_TARGET_RECIPES = 20;
const BATCH_SIZE = 2; // Process recipes in batches to avoid overwhelming the API

type LogFunction = (message: string) => void;

async function initializeSchema(log: LogFunction = console.log) {
  log('Initializing database schema...');
  const schema = `
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
      log(`Schema statement warning: ${error}`);
    }
  }
  log('Schema initialized successfully');
}

async function getOrCreateIngredient(name: string): Promise<number> {
  // Ensure name is a string and normalize it
  const normalized = String(name || '').trim().toLowerCase();
  
  if (!normalized) {
    throw new Error('Ingredient name cannot be empty');
  }
  
  // Try to find existing ingredient
  const existing = await query<{ id: number }>(
    'SELECT id FROM ingredients WHERE name = $1',
    [normalized]
  );

  if (existing.length > 0) {
    return existing[0].id;
  }

  // Create new ingredient (ignore if already exists)
  try {
    const result = await query<{ id: number }>(
      'INSERT INTO ingredients (name) VALUES ($1) RETURNING id',
      [normalized]
    );
    return result[0].id;
  } catch (error: any) {
    // If unique constraint violation, fetch the existing id
    if (error.code === '23505') { // Unique violation error code
      const existing = await query<{ id: number }>(
        'SELECT id FROM ingredients WHERE name = $1',
        [normalized]
      );
      if (existing.length > 0) {
        return existing[0].id;
      }
    }
    throw error;
  }
}

async function getCountryId(countryCode: string): Promise<number> {
  const result = await query<{ id: number }>(
    'SELECT id FROM countries WHERE code = $1',
    [countryCode.toUpperCase()]
  );
  
  if (result.length === 0) {
    throw new Error(`Country code ${countryCode} not found`);
  }
  
  return result[0].id;
}

async function insertRecipe(recipe: RecipeData, language: string = 'es', country: string = 'argentina'): Promise<number> {
  // Map country name to country code
  const countryCodeMap: { [key: string]: string } = {
    'argentina': 'AR',
    'mexico': 'MX',
    'spain': 'ES',
    'italy': 'IT',
    'china': 'CN',
    'japan': 'JP',
    'peru': 'PE',
    'usa': 'US'
  };
  
  const countryCode = countryCodeMap[country.toLowerCase()] || 'AR';
  const countryId = await getCountryId(countryCode);
  
  // Insert recipe with new schema (description, prep_time, cook_time, country_id, servings)
  const servings = (recipe as any).servings ?? null;
  const description = recipe.instructions.length > 0 ? recipe.instructions[0] : recipe.title;
  const prepTime = 15; // Default values
  const cookTime = 30;
  
  const recipeResult = await query<{ id: number }>(
    `INSERT INTO recipes (title, description, difficulty, prep_time, cook_time, country_id, servings) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) 
     RETURNING id`,
    [recipe.title, description, recipe.difficulty, prepTime, cookTime, countryId, servings]
  );

  const recipeId = recipeResult[0].id;

  // Insert instructions into separate table
  for (let i = 0; i < recipe.instructions.length; i++) {
    const instruction = String(recipe.instructions[i] || '').trim();
    if (!instruction) continue; // Skip empty instructions
    
    await execute(
      `INSERT INTO instructions (recipe_id, step_number, instruction) 
       VALUES ($1, $2, $3)`,
      [recipeId, i + 1, instruction]
    );
  }

  // Insert ingredients and relationships
  for (const ingredientName of recipe.ingredients) {
    // Ensure ingredient is a string
    const ingredientStr = String(ingredientName || '').trim();
    if (!ingredientStr) continue; // Skip empty ingredients
    
    const ingredientId = await getOrCreateIngredient(ingredientStr);
    
    // Truncate quantity to 150 characters (database limit)
    const quantity = ingredientStr.substring(0, 150);
    
    await execute(
      `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (recipe_id, ingredient_id) DO NOTHING`,
      [recipeId, ingredientId, quantity]
    );
  }

  return recipeId;
}

export async function seedRecipes(log: LogFunction = console.log, targetRecipes: number = DEFAULT_TARGET_RECIPES) {
  log(`Starting seed process for ${targetRecipes} recipes...`);
  
  const geminiService = new GeminiService();
  let successCount = 0;
  let errorCount = 0;

  // Available countries for recipe generation
  const countries = ['argentina', 'mexico', 'spain', 'italy', 'china', 'japan', 'peru', 'usa'] as const;

  // Check how many recipes already exist
  const existing = await query<{ count: string }>('SELECT COUNT(*) as count FROM recipes');
  const existingCount = parseInt(existing[0].count);
  
  if (existingCount >= targetRecipes) {
    log(`Already have ${existingCount} recipes. Target reached.`);
    return;
  }

  const recipesToGenerate = targetRecipes - existingCount;
  log(`Generating ${recipesToGenerate} new recipes from all countries...`);

  for (let i = 0; i < recipesToGenerate; i += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, recipesToGenerate - i);
    const batch = Array.from({ length: batchSize }, (_, idx) => i + idx + 1);

    log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1} (recipes ${i + 1}-${i + batchSize})...`);

    const promises = batch.map(async (recipeNum) => {
      try {
        // Select random country
        const randomCountry = countries[Math.floor(Math.random() * countries.length)];
        
        // Generate recipe with Gemini in Spanish for random country
        const generatedRecipe = await geminiService.generateRecipe(undefined, randomCountry, 'es');
        
        // Validate and normalize
        const validatedRecipe = validateRecipeData(generatedRecipe);
        
        // Insert into database
        const recipeId = await insertRecipe(validatedRecipe, 'es', randomCountry);
        
        successCount++;
        log(`✓ Recipe ${recipeNum}/${recipesToGenerate}: "${validatedRecipe.title}" [${randomCountry.toUpperCase()}] (ID: ${recipeId})`);
        
        return { success: true, recipeNum };
      } catch (error) {
        errorCount++;
        log(`✗ Recipe ${recipeNum}/${recipesToGenerate} failed: ${error}`);
        return { success: false, recipeNum, error };
      }
    });

    await Promise.all(promises);

    // Add a small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < recipesToGenerate) {
      log('Waiting 5 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  log(`\n=== Seed Complete ===`);
  log(`Successfully created: ${successCount} recipes`);
  log(`Errors: ${errorCount} recipes`);
  
  // Final count
  const final = await query<{ count: string }>('SELECT COUNT(*) as count FROM recipes');
  log(`Total recipes in database: ${final[0].count}`);
}

async function main() {
  try {
    // Skip schema initialization - tables already exist in Neon
    // await initializeSchema();
    await seedRecipes();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error during seeding:', error);
    process.exit(1);
  }
}

// Only run main if called directly
if (require.main === module) {
  main();
}
