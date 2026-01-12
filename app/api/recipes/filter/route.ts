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
    }>(queryText, params);

    // Get ingredients and instructions for each recipe
    const recipesWithIngredients = await Promise.all(
      recipes.map(async (recipe) => {
        const instructions = await query<{ instruction: string }>(
          `SELECT instruction
           FROM instructions
           WHERE recipe_id = $1
           ORDER BY step_number`,
          [recipe.id]
        );

        const ingredients = await query<{ name: string; quantity: string }>(
          `SELECT i.name, ri.quantity
           FROM ingredients i
           INNER JOIN recipe_ingredients ri ON i.id = ri.ingredient_id
           WHERE ri.recipe_id = $1
           ORDER BY i.name`,
          [recipe.id]
        );

        return {
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
