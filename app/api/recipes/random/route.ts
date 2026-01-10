import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Get a random recipe from the database
    const recipes = await query<{
      id: number;
      title: string;
      instructions: any;
      difficulty: string;
      language: string;
      country: string;
      created_at: Date;
    }>(
      `SELECT id, title, instructions, difficulty, language, country, created_at 
       FROM recipes 
       WHERE language = 'es'
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

    // Get ingredients for this recipe
    const ingredients = await query<{ name: string }>(
      `SELECT i.name 
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
        ingredients: ingredients.map(ing => ing.name),
        instructions: recipe.instructions,
        difficulty: recipe.difficulty,
        country: recipe.country,
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
