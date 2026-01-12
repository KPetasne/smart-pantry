import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Optimized query with JSON aggregation to avoid N+1 problem
    const recipes = await query<{
      id: number;
      title: string;
      prep_time: number;
      cook_time: number;
      difficulty: string;
      servings: number | null;
      rating_count: number;
      rating_sum: number;
      average_rating: number;
      country_name: string;
      country_code: string;
      created_at: Date;
      instructions: Array<{ step: number; text: string }>;
      ingredients: string[];
    }>(
      `SELECT 
        r.id,
        r.title,
        r.prep_time,
        r.cook_time,
        r.difficulty,
        r.servings,
        r.rating_count,
        r.rating_sum,
        r.average_rating,
        c.name as country_name,
        c.code as country_code,
        r.created_at,
        COALESCE(
          json_agg(
            jsonb_build_object(
              'step', i.step_number,
              'text', i.instruction
            ) ORDER BY i.step_number
          ) FILTER (WHERE i.id IS NOT NULL),
          '[]'
        ) as instructions,
        COALESCE(
          array_agg(DISTINCT ri.quantity) FILTER (WHERE ri.recipe_id IS NOT NULL),
          ARRAY[]::text[]
        ) as ingredients
       FROM recipes r
       INNER JOIN countries c ON r.country_id = c.id
       LEFT JOIN instructions i ON r.id = i.recipe_id
       LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
       GROUP BY r.id, r.title, r.prep_time, r.cook_time, r.difficulty, r.servings,
                r.rating_count, r.rating_sum, r.average_rating, c.name, c.code, r.created_at
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

    return NextResponse.json(
      {
        id: recipe.id,
        title: recipe.title,
        prepTime: recipe.prep_time,
        cookTime: recipe.cook_time,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions.map(i => i.text),
        difficulty: recipe.difficulty,
        servings: recipe.servings ?? undefined,
        rating_count: recipe.rating_count,
        rating_sum: recipe.rating_sum,
        average_rating: recipe.average_rating,
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
