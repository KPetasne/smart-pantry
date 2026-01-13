import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';

const filterSchema = z.object({
  diet: z.enum(['carnivore', 'vegan']).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  limit: z.number().int().min(1).max(10).default(3),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { diet, difficulty, limit } = filterSchema.parse(body);

    let queryText = `
      SELECT r.id, r.title, r.prep_time, r.cook_time, r.difficulty, r.servings, 
             r.rating_count, r.rating_sum, r.average_rating, r.image_url,
             c.name as country_name, c.code as country_code, r.created_at
      FROM recipes r
      INNER JOIN countries c ON r.country_id = c.id
    `;
    const params: any[] = [];
    let paramIndex = 1;
    const conditions: string[] = [];

    // Filter by difficulty if provided
    if (difficulty) {
      conditions.push(`r.difficulty = $${paramIndex}`);
      params.push(difficulty);
      paramIndex++;
    }

    // Filter by diet (carnivore = has meat, vegan = no meat)
    if (diet === 'carnivore') {
      queryText += `
        INNER JOIN recipe_ingredients ri ON r.id = ri.recipe_id
        INNER JOIN ingredients i ON ri.ingredient_id = i.id
      `;
      conditions.push(`(
        i.name LIKE $${paramIndex} OR 
        i.name LIKE $${paramIndex + 1} OR 
        i.name LIKE $${paramIndex + 2} OR
        i.name LIKE $${paramIndex + 3} OR
        i.name LIKE $${paramIndex + 4}
      )`);
      params.push('%pollo%', '%carne%', '%cerdo%', '%res%', '%pescado%');
      paramIndex += 5;
    } else if (diet === 'vegan') {
      // For vegan, exclude recipes that have any animal products
      queryText += `
        WHERE r.id NOT IN (
          SELECT DISTINCT ri.recipe_id
          FROM recipe_ingredients ri
          INNER JOIN ingredients i ON ri.ingredient_id = i.id
          WHERE 
            i.name LIKE '%pollo%' OR 
            i.name LIKE '%carne%' OR 
            i.name LIKE '%cerdo%' OR
            i.name LIKE '%res%' OR
            i.name LIKE '%pescado%' OR
            i.name LIKE '%huevo%' OR
            i.name LIKE '%leche%' OR
            i.name LIKE '%queso%' OR
            i.name LIKE '%manteca%' OR
            i.name LIKE '%mantequilla%' OR
            i.name LIKE '%crema%' OR
            i.name LIKE '%yogur%' OR
            i.name LIKE '%miel%'
        )
      `;
    }

    if (conditions.length > 0) {
      if (diet === 'vegan') {
        // For vegan, conditions are already in WHERE clause
        queryText += ` AND ${conditions.join(' AND ')}`;
      } else {
        queryText += ` WHERE ${conditions.join(' AND ')}`;
      }
    }

    queryText += ` ORDER BY RANDOM() LIMIT $${paramIndex}`;
    params.push(limit);

    // Optimized query with JSON aggregation to avoid N+1 problem
    const baseQuery = `
      SELECT 
        base.id,
        base.title,
        base.prep_time,
        base.cook_time,
        base.difficulty,
        base.servings,
        base.rating_count,
        base.rating_sum,
        base.average_rating,
        base.image_url,
        base.country_name,
        base.country_code,
        base.created_at,
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
      FROM (${queryText}) as base
      LEFT JOIN instructions i ON base.id = i.recipe_id
      LEFT JOIN recipe_ingredients ri ON base.id = ri.recipe_id
      GROUP BY base.id, base.title, base.prep_time, base.cook_time, base.difficulty, base.servings,
               base.rating_count, base.rating_sum, base.average_rating, base.image_url, base.country_name, base.country_code, base.created_at
    `;

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
      image_url: string | null;
      country_name: string;
      country_code: string;
      created_at: Date;
      instructions: Array<{ step: number; text: string }>;
      ingredients: string[];
    }>(baseQuery, params);

    // Transform the aggregated data
    const recipesWithDetails = recipes.map(recipe => ({
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
      image_url: recipe.image_url ?? undefined,
      country: recipe.country_code.toLowerCase(),
      created_at: recipe.created_at,
    }));

    return NextResponse.json(recipesWithDetails);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in filter endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
