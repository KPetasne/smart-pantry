import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query, execute } from '@/lib/db';
import { z } from 'zod';
import { validateRecipeData } from '@/lib/recipe-normalizer';

// Schema for creating/updating recipes
const recipeSchema = z.object({
  title: z.string().min(1).max(255),
  prepTime: z.number().int().min(1).max(480).optional(),
  cookTime: z.number().int().min(1).max(480).optional(),
  ingredients: z.array(z.string().min(1)).min(1),
  instructions: z.array(z.string().min(1)).min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  servings: z.number().int().min(1).max(12).optional(),
  country: z.string().length(2).optional(), // Country code (AR, MX, etc)
});

// GET - List recipes with pagination
export async function GET(request: Request) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  try {
    // Get total count
    const countResult = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM recipes'
    );
    const total = parseInt(countResult[0].count);

    // Get paginated recipes
    const recipes = await query<{
      id: number;
      title: string;
      prep_time: number;
      cook_time: number;
      difficulty: string;
      servings: number | null;
      country_code: string;
      country_name: string;
      created_at: Date;
    }>(
      `SELECT r.id, r.title, r.prep_time, r.cook_time, r.difficulty, r.servings, 
              c.code as country_code, c.name as country_name, r.created_at 
       FROM recipes r
       INNER JOIN countries c ON r.country_id = c.id
       ORDER BY r.created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return NextResponse.json({
      recipes: recipes.map(r => ({
        id: r.id,
        title: r.title,
        prepTime: r.prep_time,
        cookTime: r.cook_time,
        difficulty: r.difficulty,
        servings: r.servings ?? undefined,
        country: r.country_code,
        countryName: r.country_name,
        created_at: r.created_at,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new recipe
export async function POST(request: Request) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = recipeSchema.parse(body);
    const recipe = validateRecipeData(validatedData);

    // Get country_id (default to Argentina if not provided)
    const countryCode = validatedData.country || 'AR';
    const countryResult = await query<{ id: number }>(
      'SELECT id FROM countries WHERE code = $1',
      [countryCode.toUpperCase()]
    );
    
    if (countryResult.length === 0) {
      return NextResponse.json({ error: 'Invalid country code' }, { status: 400 });
    }
    
    const countryId = countryResult[0].id;

    // Insert recipe
    const recipeResult = await query<{ id: number }>(
      `INSERT INTO recipes (title, prep_time, cook_time, difficulty, servings, country_id) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id`,
      [
        recipe.title,
        recipe.prepTime,
        recipe.cookTime,
        recipe.difficulty,
        recipe.servings ?? null,
        countryId,
      ]
    );

    const recipeId = recipeResult[0].id;

    // Insert instructions
    for (let i = 0; i < recipe.instructions.length; i++) {
      await execute(
        `INSERT INTO instructions (recipe_id, step_number, instruction) 
         VALUES ($1, $2, $3)`,
        [recipeId, i + 1, recipe.instructions[i]]
      );
    }

    // Insert ingredients and relationships
    for (const ingredientName of recipe.ingredients) {
      const normalized = ingredientName.trim().toLowerCase();
      
      // Get or create ingredient
      let ingredientId: number;
      try {
        const ingredientResult = await query<{ id: number }>(
          'INSERT INTO ingredients (name) VALUES ($1) RETURNING id',
          [normalized]
        );
        ingredientId = ingredientResult[0].id;
      } catch (error: any) {
        if (error.code === '23505') {
          const existing = await query<{ id: number }>(
            'SELECT id FROM ingredients WHERE name = $1',
            [normalized]
          );
          ingredientId = existing[0].id;
        } else {
          throw error;
        }
      }

      // Create relationship
      await execute(
        `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (recipe_id, ingredient_id) DO NOTHING`,
        [recipeId, ingredientId, ingredientName.substring(0, 150)]
      );
    }

    return NextResponse.json({
      success: true,
      id: recipeId,
      message: 'Recipe created successfully',
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating recipe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
