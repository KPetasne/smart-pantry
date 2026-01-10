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
      instructions: any;
      difficulty: string;
      language: string;
      created_at: Date;
      match_count: number;
    }>(
      `SELECT 
        r.id as recipe_id,
        r.title,
        r.instructions,
        r.difficulty,
        r.language,
        r.created_at,
        COUNT(ri.ingredient_id) as match_count
      FROM recipes r
      INNER JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      INNER JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE i.name = ANY($1::text[]) AND r.language = 'es'
      GROUP BY r.id, r.title, r.instructions, r.difficulty, r.language, r.created_at
      HAVING COUNT(DISTINCT i.name) = $2
      ORDER BY r.created_at DESC
      LIMIT 1`,
      [normalizedIngredients, normalizedIngredients.length]
    );

    // If recipe found in cache, return it
    if (matchingRecipes.length > 0) {
      const recipe = matchingRecipes[0];

      // Get all ingredients for this recipe
      const recipeIngredients = await query<{ name: string }>(
        `SELECT i.name 
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
        ingredients: recipeIngredients.map(ing => ing.name),
        instructions: recipe.instructions,
        difficulty: recipe.difficulty,
        created_at: recipe.created_at,
        fromCache: true,
      });
    }

    // If not found, generate new recipe with Gemini
    const geminiService = new GeminiService();
    const generatedRecipe = await geminiService.generateRecipe(normalizedIngredients, 'argentina', 'es');
    const validatedRecipe = validateRecipeData(generatedRecipe);

    // Insert into database using transaction
    // First, insert the recipe
    const recipeResult = await query<{ id: number }>(
      `INSERT INTO recipes (title, instructions, difficulty, language, country) 
       VALUES ($1, $2::jsonb, $3, $4, $5) 
       RETURNING id`,
      [validatedRecipe.title, JSON.stringify(validatedRecipe.instructions), validatedRecipe.difficulty, validatedRecipe.language, validatedRecipe.country]
    );

    const recipeId = recipeResult[0].id;

    // Then, insert ingredients and relationships
    for (const ingredientName of validatedRecipe.ingredients) {
      // Get or create ingredient
      const ingredientResult = await query<{ id: number }>(
        `INSERT INTO ingredients (name) 
         VALUES ($1) 
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name 
         RETURNING id`,
        [ingredientName.trim().toLowerCase()]
      );

      const ingredientId = ingredientResult[0].id;

      // Create relationship
      await execute(
        `INSERT INTO recipe_ingredients (recipe_id, ingredient_id) 
         VALUES ($1, $2) 
         ON CONFLICT DO NOTHING`,
        [recipeId, ingredientId]
      );
    }

    // Track search analytics (non-blocking)
    trackSearch(normalizedIngredients).catch(err => 
      console.error('Failed to track search:', err)
    );

    return NextResponse.json({
      id: recipeId,
      title: validatedRecipe.title,
      ingredients: validatedRecipe.ingredients,
      instructions: validatedRecipe.instructions,
      difficulty: validatedRecipe.difficulty,
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
