import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { GeminiService } from '@/lib/gemini-service';
import { normalizeIngredients, validateRecipeData } from '@/lib/recipe-normalizer';
import { trackSearch } from '@/lib/analytics';
import { z } from 'zod';

const searchSchema = z.object({
  ingredients: z.array(z.string().min(1)).min(1).max(10),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ingredients } = searchSchema.parse(body);

    // Normalize ingredients
    const normalizedIngredients = normalizeIngredients(ingredients);

    if (normalizedIngredients.length === 0) {
      return NextResponse.json(
        { error: 'At least one valid ingredient is required' },
        { status: 400 }
      );
    }

    // Smart Cache: Search for existing recipes that contain ALL the ingredients
    const placeholders = normalizedIngredients.map((_, i) => `$${i + 1}`).join(',');
    
    const matchingRecipes = await query<{
      recipe_id: number;
      title: string;
      prep_time: number;
      cook_time: number;
      difficulty: string;
      servings: number | null;
      country_name: string;
      country_code: string;
      rating_count: number;
      rating_sum: number;
      average_rating: number;
      created_at: Date;
      image_url: string | null;
      match_count: number;
    }>(
      `SELECT 
        r.id as recipe_id,
        r.title,
        r.prep_time,
        r.cook_time,
        r.difficulty,
        r.servings,
        c.name as country_name,
        c.code as country_code,
        r.rating_count,
        r.rating_sum,
        r.average_rating,
        r.created_at,
        r.image_url,
        COUNT(ri.ingredient_id) as match_count
      FROM recipes r
      INNER JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      INNER JOIN ingredients i ON ri.ingredient_id = i.id
      INNER JOIN countries c ON r.country_id = c.id
      WHERE i.name = ANY($1::text[])
      GROUP BY r.id, r.title, r.prep_time, r.cook_time, r.difficulty, r.servings, c.name, c.code, r.rating_count, r.rating_sum, r.average_rating, r.created_at, r.image_url
      HAVING COUNT(DISTINCT i.name) = $2
      ORDER BY r.created_at DESC
      LIMIT 1`,
      [normalizedIngredients, normalizedIngredients.length]
    );

    // If recipe found in cache, return it
    if (matchingRecipes.length > 0) {
      const recipe = matchingRecipes[0];

      // Get instructions for this recipe
      const instructions = await query<{ instruction: string }>(
        `SELECT instruction
         FROM instructions
         WHERE recipe_id = $1
         ORDER BY step_number`,
        [recipe.recipe_id]
      );

      // Get all ingredients for this recipe
      const recipeIngredients = await query<{ name: string; quantity: string }>(
        `SELECT i.name, ri.quantity
         FROM ingredients i
         INNER JOIN recipe_ingredients ri ON i.id = ri.ingredient_id
         WHERE ri.recipe_id = $1
         ORDER BY i.name`,
        [recipe.recipe_id]
      );

      // Track search analytics (non-blocking)
      trackSearch(normalizedIngredients).catch(err => 
        console.error('Failed to track search:', err)
      );

      return NextResponse.json({
        id: recipe.recipe_id,
        title: recipe.title,
        prepTime: recipe.prep_time,
        cookTime: recipe.cook_time,
        ingredients: recipeIngredients.map(ing => ing.quantity || ing.name),
        instructions: instructions.map(i => i.instruction),
        difficulty: recipe.difficulty,
        servings: recipe.servings ?? undefined,
        rating_count: recipe.rating_count,
        rating_sum: recipe.rating_sum,
        average_rating: recipe.average_rating,
        country: recipe.country_code.toLowerCase(),
        created_at: recipe.created_at,
        image_url: recipe.image_url ?? undefined,
        fromCache: true,
      });
    }

    // If not found, generate new recipe with Gemini
    const geminiService = new GeminiService();
    const generatedRecipe = await geminiService.generateRecipe(normalizedIngredients, 'argentina', 'es');
    const validatedRecipe = validateRecipeData(generatedRecipe);

    // Get country_id for Argentina
    const countryResult = await query<{ id: number }>(
      'SELECT id FROM countries WHERE code = $1',
      ['AR']
    );
    const countryId = countryResult[0].id;

    // Insert into database using transaction
    const { pool } = await import('@/lib/db');
    const client = await pool.connect();
    
    let recipeId: number;
    
    try {
      await client.query('BEGIN');

      // Insert the recipe
      const recipeResult = await client.query<{ id: number }>(
        `INSERT INTO recipes (title, difficulty, prep_time, cook_time, country_id, servings) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id`,
        [
          validatedRecipe.title,
          validatedRecipe.difficulty,
          validatedRecipe.prepTime,
          validatedRecipe.cookTime,
          countryId,
          validatedRecipe.servings ?? null
        ]
      );

      recipeId = recipeResult.rows[0].id;

      // Insert instructions
      for (let i = 0; i < validatedRecipe.instructions.length; i++) {
        await client.query(
          `INSERT INTO instructions (recipe_id, step_number, instruction) 
           VALUES ($1, $2, $3)`,
          [recipeId, i + 1, validatedRecipe.instructions[i]]
        );
      }

      // Insert ingredients and relationships
      for (const ingredientName of validatedRecipe.ingredients) {
        const normalizedName = ingredientName.trim().toLowerCase();
        
        let ingredientId: number;
        try {
          const ingredientResult = await client.query<{ id: number }>(
            `INSERT INTO ingredients (name) VALUES ($1) RETURNING id`,
            [normalizedName]
          );
          ingredientId = ingredientResult.rows[0].id;
        } catch (error: any) {
          if (error.code === '23505') {
            const existing = await client.query<{ id: number }>(
              'SELECT id FROM ingredients WHERE name = $1',
              [normalizedName]
            );
            ingredientId = existing.rows[0].id;
          } else {
            throw error;
          }
        }

        // Create relationship with quantity
        await client.query(
          `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (recipe_id, ingredient_id) DO NOTHING`,
          [recipeId, ingredientId, ingredientName.substring(0, 150)]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    // Track search analytics (non-blocking)
    trackSearch(normalizedIngredients).catch(err => 
      console.error('Failed to track search:', err)
    );

    return NextResponse.json({
      id: recipeId,
      title: validatedRecipe.title,
      prepTime: validatedRecipe.prepTime,
      cookTime: validatedRecipe.cookTime,
      ingredients: validatedRecipe.ingredients,
      instructions: validatedRecipe.instructions,
      difficulty: validatedRecipe.difficulty,
      servings: validatedRecipe.servings,
      country: 'argentina',
      created_at: new Date(),
      fromCache: false,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in search endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
