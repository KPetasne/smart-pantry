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
      SELECT r.id, r.title, r.instructions, r.difficulty, r.language, r.country, r.created_at
      FROM recipes r
    `;
    const params: any[] = [];
    let paramIndex = 1;
    const conditions: string[] = [];

    // Always filter by language
    conditions.push(`r.language = 'es'`);

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
      queryText += `
        LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
        LEFT JOIN ingredients i ON ri.ingredient_id = i.id AND (
          i.name LIKE '%pollo%' OR 
          i.name LIKE '%carne%' OR 
          i.name LIKE '%cerdo%' OR
          i.name LIKE '%res%' OR
          i.name LIKE '%pescado%' OR
          i.name LIKE '%huevo%' OR
          i.name LIKE '%leche%' OR
          i.name LIKE '%queso%'
        )
      `;
      conditions.push('i.id IS NULL');
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(' AND ')}`;
    }

    queryText += ` ORDER BY RANDOM() LIMIT $${paramIndex}`;
    params.push(limit);

    const recipes = await query<{
      id: number;
      title: string;
      instructions: any;
      difficulty: string;
      language: string;
      country: string;
      created_at: Date;
    }>(queryText, params);

    // Get ingredients for each recipe
    const recipesWithIngredients = await Promise.all(
      recipes.map(async (recipe) => {
        const ingredients = await query<{ name: string }>(
          `SELECT i.name 
           FROM ingredients i
           INNER JOIN recipe_ingredients ri ON i.id = ri.ingredient_id
           WHERE ri.recipe_id = $1
           ORDER BY i.name`,
          [recipe.id]
        );

        return {
          id: recipe.id,
          title: recipe.title,
          ingredients: ingredients.map(ing => ing.name),
          instructions: recipe.instructions,
          difficulty: recipe.difficulty,
          country: recipe.country,
          created_at: recipe.created_at,
        };
      })
    );

    return NextResponse.json(recipesWithIngredients);
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
