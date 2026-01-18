import 'dotenv/config';
import * as readline from 'readline';
import { query, execute } from '../lib/db';
import { GeminiService } from '../lib/gemini-service';
import { validateRecipeData, type RecipeData } from '../lib/recipe-normalizer';
import type { Country } from '../lib/prompts';

type LogFunction = (message: string) => void;

const GEMINI_MODELS = [
  'gemini-3-pro-preview',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
  'gemini-2.0-flash'
] as const;

type GeminiModel = typeof GEMINI_MODELS[number];

// Map country name to country code
const COUNTRY_CODE_MAP: { [key: string]: string } = {
  'argentina': 'AR',
  'mexico': 'MX',
  'spain': 'ES',
  'italy': 'IT',
  'china': 'CN',
  'japan': 'JP',
  'peru': 'PE',
  'usa': 'US',
  'medio-oriente': 'ME'
};

// Map country code to country name (for API calls)
const CODE_TO_COUNTRY_MAP: { [key: string]: Country } = {
  'AR': 'argentina',
  'MX': 'mexico',
  'ES': 'spain',
  'IT': 'italy',
  'CN': 'china',
  'JP': 'japan',
  'PE': 'peru',
  'US': 'usa',
  'ME': 'medio-oriente'
};

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
  const countryCode = COUNTRY_CODE_MAP[country.toLowerCase()] || 'AR';
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
    const instruction = recipe.instructions[i];
    
    // Validate instruction is a string
    if (typeof instruction !== 'string' || !instruction.trim()) {
      console.warn(`Skipping invalid instruction at position ${i + 1}`);
      continue;
    }
    
    await execute(
      `INSERT INTO instructions (recipe_id, step_number, instruction) 
       VALUES ($1, $2, $3)`,
      [recipeId, i + 1, instruction.trim()]
    );
  }

  // Insert ingredients and relationships
  for (const ingredientName of recipe.ingredients) {
    // Validate ingredient is a string
    if (typeof ingredientName !== 'string' || !ingredientName.trim()) {
      console.warn(`Skipping invalid ingredient: ${ingredientName}`);
      continue;
    }
    
    const ingredientStr = ingredientName.trim();
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

export async function seedRecipes(log: LogFunction = console.log, targetRecipes: number, batchSize: number, modelName: string = 'gemini-2.5-flash', selectedCountry: Country | null = null) {
  log(`Starting seed process for ${targetRecipes} recipes...`);
  log(`Batch size: ${batchSize}`);
  log(`Using model: ${modelName}`);
  
  // Convert country code to country name if it looks like a code (2 uppercase letters)
  let countryForPrompts = selectedCountry;
  if (selectedCountry && selectedCountry.length === 2 && selectedCountry === selectedCountry.toUpperCase()) {
    countryForPrompts = CODE_TO_COUNTRY_MAP[selectedCountry] || selectedCountry;
    log(`Converting country code ${selectedCountry} to ${countryForPrompts}`);
  }
  
  if (countryForPrompts) {
    log(`Filtering recipes by country: ${countryForPrompts}`);
  }
  
  const geminiService = new GeminiService(modelName);
  let successCount = 0;
  let errorCount = 0;

  // Available countries for recipe generation
  const countries = ['argentina', 'mexico', 'spain', 'italy', 'china', 'japan', 'peru', 'usa', 'medio-oriente'] as const;

  // Check how many recipes already exist
  const existing = await query<{ count: string }>('SELECT COUNT(*) as count FROM recipes');
  const existingCount = parseInt(existing[0].count);
  
  log(`Current recipes in database: ${existingCount}`);
  log(`Will generate ${targetRecipes} new recipes...`);
  
  // Get existing recipe titles to avoid duplicates
  log('Fetching existing recipe titles to avoid duplicates...');
  const existingTitles = await query<{ title: string }>('SELECT title FROM recipes');
  let existingTitlesList = existingTitles.map(r => r.title);
  log(`Found ${existingTitlesList.length} existing recipe titles`);
  
  // Filter existing titles by country if specific country selected
  if (countryForPrompts) {
    const countryCode = COUNTRY_CODE_MAP[countryForPrompts];
    const countryFilteredTitles = await query<{ title: string }>(
      `SELECT r.title 
       FROM recipes r 
       INNER JOIN countries c ON r.country_id = c.id 
       WHERE c.code = $1`,
      [countryCode]
    );
    existingTitlesList = countryFilteredTitles.map(r => r.title);
    log(`Filtered to ${existingTitlesList.length} existing ${countryForPrompts} recipes for duplicate detection`);
  }
  
  const recipesToGenerate = targetRecipes;
  const countryMsg = countryForPrompts ? `from ${countryForPrompts}` : 'from all countries';
  log(`Generating ${recipesToGenerate} new recipes ${countryMsg}...`);

  for (let i = 0; i < recipesToGenerate; i += batchSize) {
    const currentBatchSize = Math.min(batchSize, recipesToGenerate - i);
    const batch = Array.from({ length: currentBatchSize }, (_, idx) => i + idx + 1);

    log(`\nProcessing batch ${Math.floor(i / batchSize) + 1} (recipes ${i + 1}-${i + currentBatchSize})...`);

    const promises = batch.map(async (recipeNum) => {
      try {
        // Select country based on configuration
        const randomCountry = countryForPrompts || countries[Math.floor(Math.random() * countries.length)];
        
        // Generate recipe with Gemini in Spanish for random country, passing existing titles
        const generatedRecipe = await geminiService.generateRecipe(undefined, randomCountry, 'es', existingTitlesList);
        
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
    if (i + batchSize < recipesToGenerate) {
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

function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

function question(rl: readline.Interface, prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  const rl = createReadlineInterface();
  
  try {
    // Ask for number of recipes
    const recipesAnswer = await question(rl, '¿Cuántas recetas deseas generar? ');
    const targetRecipes = parseInt(recipesAnswer);
    
    if (isNaN(targetRecipes) || targetRecipes <= 0) {
      console.error('Error: Debes ingresar un número válido mayor a 0');
      rl.close();
      process.exit(1);
    }
    
    // Ask for batch size
    const batchAnswer = await question(rl, '¿Cuál es el tamaño del batch? ');
    const batchSize = parseInt(batchAnswer);
    
    if (isNaN(batchSize) || batchSize <= 0) {
      console.error('Error: Debes ingresar un número válido mayor a 0');
      rl.close();
      process.exit(1);
    }
    
    // Show country options
    console.log('\nPaíses disponibles:');
    console.log('0. Todos los países (aleatorio)');
    const countryNames: { [key: string]: string } = {
      'argentina': 'Argentina',
      'mexico': 'México',
      'spain': 'España',
      'italy': 'Italia',
      'china': 'China',
      'japan': 'Japón',
      'peru': 'Perú',
      'usa': 'USA',
      'medio-oriente': 'Medio Oriente'
    };
    const countryList = ['argentina', 'mexico', 'spain', 'italy', 'china', 'japan', 'peru', 'usa', 'medio-oriente'] as const;
    countryList.forEach((country, index) => {
      console.log(`${index + 1}. ${countryNames[country]}`);
    });
    
    const countryAnswer = await question(rl, '\nSelecciona el número del país (0 para todos): ');
    const countryIndex = parseInt(countryAnswer);
    
    if (isNaN(countryIndex) || countryIndex < 0 || countryIndex > countryList.length) {
      console.error('Error: Debes seleccionar un número válido de la lista');
      rl.close();
      process.exit(1);
    }
    
    const selectedCountry = countryIndex === 0 ? null : countryList[countryIndex - 1];
    
    // Show model options
    console.log('\nModelos disponibles:');
    GEMINI_MODELS.forEach((model, index) => {
      console.log(`${index + 1}. ${model}`);
    });
    
    const modelAnswer = await question(rl, '\nSelecciona el número del modelo: ');
    const modelIndex = parseInt(modelAnswer) - 1;
    
    if (isNaN(modelIndex) || modelIndex < 0 || modelIndex >= GEMINI_MODELS.length) {
      console.error('Error: Debes seleccionar un número válido de la lista');
      rl.close();
      process.exit(1);
    }
    
    const selectedModel = GEMINI_MODELS[modelIndex];
    
    rl.close();
    
    console.log('\n--- Configuración ---');
    console.log(`Recetas: ${targetRecipes}`);
    console.log(`Batch: ${batchSize}`);
    console.log(`País: ${selectedCountry ? countryNames[selectedCountry] : 'Todos (aleatorio)'}`);
    console.log(`Modelo: ${selectedModel}`);
    console.log('---\n');
    
    await seedRecipes(console.log, targetRecipes, batchSize, selectedModel, selectedCountry);
    process.exit(0);
  } catch (error) {
    console.error('Fatal error during seeding:', error);
    rl.close();
    process.exit(1);
  }
}

// Only run main if called directly
if (require.main === module) {
  main();
}
