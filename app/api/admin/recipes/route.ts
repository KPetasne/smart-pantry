import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query, execute } from '@/lib/db';
import { z } from 'zod';
import { validateRecipeData } from '@/lib/recipe-normalizer';

// Schema for creating/updating recipes
const recipeSchema = z.object({
  title: z.string().min(1).max(255),
  ingredients: z.array(z.string().min(1)).min(1),
  instructions: z.array(z.string().min(1)).min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  language: z.string().length(2).default('es'),
  country: z.string().min(1).max(50).default('argentina'),
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
      difficulty: string;
      language: string;
      country: string;
      created_at: Date;
    }>(
      `SELECT id, title, difficulty, language, country, created_at 
       FROM recipes 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return NextResponse.json({
      recipes,
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

    // Insert recipe
    const recipeResult = await query<{ id: number }>(
      `INSERT INTO recipes (title, instructions, difficulty, language, country) 
       VALUES ($1, $2::jsonb, $3, $4, $5) 
       RETURNING id`,
      [
        recipe.title,
        JSON.stringify(recipe.instructions),
        recipe.difficulty,
        recipe.language,
        recipe.country,
      ]
    );

    const recipeId = recipeResult[0].id;

    // Insert ingredients and relationships
    for (const ingredientName of recipe.ingredients) {
      const normalized = ingredientName.trim().toLowerCase();
      
      // Get or create ingredient
      const ingredientResult = await query<{ id: number }>(
        `INSERT INTO ingredients (name) 
         VALUES ($1) 
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name 
         RETURNING id`,
        [normalized]
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
