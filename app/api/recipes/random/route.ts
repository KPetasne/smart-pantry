import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Get a random recipe from the database
    const recipes = await query<{
      id: number;
      title: string;
      prep_time: number;
      cook_time: number;
      difficulty: string;
      servings: number | null;
      country_name: string;
      country_code: string;
      created_at: Date;
    }>(
      `SELECT r.id, r.title, r.prep_time, r.cook_time, r.difficulty, r.servings, 
              c.name as country_name, c.code as country_code, r.created_at 
       FROM recipes r
       INNER JOIN countries c ON r.country_id = c.id
       ORDER BY RANDOM() 
       LIMIT 1`
    );

    if (recipes.length === 0) {
      return NextResponse.json(
        { error: 'No recipes found in database' },
        { status: 404 }
      );
    }

    const recipe = recipes[0];

    // Get instructions for this recipe
    const instructions = await query<{ instruction: string }>(
      `SELECT instruction
       FROM instructions
       WHERE recipe_id = $1
       ORDER BY step_number`,
      [recipe.id]
    );

    // Get ingredients for this recipe
    const ingredients = await query<{ name: string; quantity: string }>(
      `SELECT i.name, ri.quantity
       FROM ingredients i
       INNER JOIN recipe_ingredients ri ON i.id = ri.ingredient_id
       WHERE ri.recipe_id = $1
       ORDER BY i.name`,
      [recipe.id]
    );

    return NextResponse.json(
      {
        id: recipe.id,
        title: recipe.title,
        prepTime: recipe.prep_time,
        cookTime: recipe.cook_time,
        ingredients: ingredients.map(ing => ing.quantity || ing.name),
        instructions: instructions.map(i => i.instruction),
        difficulty: recipe.difficulty,
        servings: recipe.servings ?? undefined,
        country: recipe.country_code.toLowerCase(),
        created_at: recipe.created_at,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching random recipe:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
