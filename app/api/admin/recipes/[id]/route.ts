import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query, execute } from '@/lib/db';
import { z } from 'zod';
import { validateRecipeData } from '@/lib/recipe-normalizer';

const recipeSchema = z.object({
  title: z.string().min(1).max(255),
  ingredients: z.array(z.string().min(1)).min(1),
  instructions: z.array(z.string().min(1)).min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  servings: z.number().int().min(1).max(12).optional(),
  language: z.string().length(2).default('es'),
  country: z.string().min(1).max(50).default('argentina'),
});

// GET - Get single recipe by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const recipeId = parseInt(id);

    if (isNaN(recipeId)) {
      return NextResponse.json({ error: 'Invalid recipe ID' }, { status: 400 });
    }

    // Get recipe
    const recipes = await query<{
      id: number;
      title: string;
      instructions: any;
      difficulty: string;
      servings: number | null;
      language: string;
      country: string;
      created_at: Date;
    }>(
      'SELECT id, title, instructions, difficulty, servings, language, country, created_at FROM recipes WHERE id = $1',
      [recipeId]
    );

    if (recipes.length === 0) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    const recipe = recipes[0];

    // Get ingredients
    const ingredients = await query<{ name: string }>(
      `SELECT i.name 
       FROM ingredients i
       INNER JOIN recipe_ingredients ri ON i.id = ri.ingredient_id
       WHERE ri.recipe_id = $1
       ORDER BY i.name`,
      [recipeId]
    );

    return NextResponse.json({
      id: recipe.id,
      title: recipe.title,
      ingredients: ingredients.map(ing => ing.name),
      instructions: Array.isArray(recipe.instructions) 
        ? recipe.instructions 
        : typeof recipe.instructions === 'string' 
          ? JSON.parse(recipe.instructions) 
          : [],
      difficulty: recipe.difficulty,
      servings: recipe.servings,
      language: recipe.language,
      country: recipe.country,
      created_at: recipe.created_at,
    });
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update recipe
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const recipeId = parseInt(id);

    if (isNaN(recipeId)) {
      return NextResponse.json({ error: 'Invalid recipe ID' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = recipeSchema.parse(body);
    const recipe = validateRecipeData(validatedData);

    // Check if recipe exists
    const existing = await query('SELECT id FROM recipes WHERE id = $1', [recipeId]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Update recipe
    await execute(
      `UPDATE recipes 
       SET title = $1, instructions = $2::jsonb, difficulty = $3, servings = $4, language = $5, country = $6 
       WHERE id = $7`,
      [
        recipe.title,
        JSON.stringify(recipe.instructions),
        recipe.difficulty,
        recipe.servings ?? null,
        recipe.language,
        recipe.country,
        recipeId,
      ]
    );

    // Delete existing ingredient relationships
    await execute('DELETE FROM recipe_ingredients WHERE recipe_id = $1', [recipeId]);

    // Insert new ingredients and relationships
    for (const ingredientName of recipe.ingredients) {
      const normalized = ingredientName.trim().toLowerCase();
      
      const ingredientResult = await query<{ id: number }>(
        `INSERT INTO ingredients (name) 
         VALUES ($1) 
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name 
         RETURNING id`,
        [normalized]
      );

      const ingredientId = ingredientResult[0].id;

      await execute(
        `INSERT INTO recipe_ingredients (recipe_id, ingredient_id) 
         VALUES ($1, $2)`,
        [recipeId, ingredientId]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Recipe updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating recipe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete recipe
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const recipeId = parseInt(id);

    if (isNaN(recipeId)) {
      return NextResponse.json({ error: 'Invalid recipe ID' }, { status: 400 });
    }

    // Check if recipe exists
    const existing = await query('SELECT id FROM recipes WHERE id = $1', [recipeId]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Delete recipe (CASCADE will handle recipe_ingredients)
    await execute('DELETE FROM recipes WHERE id = $1', [recipeId]);

    return NextResponse.json({
      success: true,
      message: 'Recipe deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
