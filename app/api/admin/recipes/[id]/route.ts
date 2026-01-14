import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query, execute, pool } from '@/lib/db';
import { z } from 'zod';
import { validateRecipeData } from '@/lib/recipe-normalizer';
import { requireAdmin } from '@/lib/auth-helpers';
import { logAuditEvent, getIpAddress, getUserAgent } from '@/lib/audit-logger';

const recipeSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(500).optional(),
  prepTime: z.number().int().min(1).max(480).optional(),
  cookTime: z.number().int().min(1).max(480).optional(),
  ingredients: z.array(z.string().min(1)).min(1),
  instructions: z.array(z.string().min(1)).min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  servings: z.number().int().min(1).max(12).optional(),
  country: z.string().length(2).optional(),
});

// GET - Get single recipe by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require admin role
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) {
    return authResult;
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
      description: string;
      prep_time: number;
      cook_time: number;
      difficulty: string;
      servings: number | null;
      country_code: string;
      country_name: string;
      created_at: Date;
    }>(
      `SELECT r.id, r.title, r.description, r.prep_time, r.cook_time, r.difficulty, r.servings,
              c.code as country_code, c.name as country_name, r.created_at 
       FROM recipes r
       INNER JOIN countries c ON r.country_id = c.id
       WHERE r.id = $1`,
      [recipeId]
    );

    if (recipes.length === 0) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    const recipe = recipes[0];

    // Get instructions
    const instructions = await query<{ instruction: string }>(
      `SELECT instruction
       FROM instructions
       WHERE recipe_id = $1
       ORDER BY step_number`,
      [recipeId]
    );

    // Get ingredients
    const ingredients = await query<{ name: string; quantity: string }>(
      `SELECT i.name, ri.quantity
       FROM ingredients i
       INNER JOIN recipe_ingredients ri ON i.id = ri.ingredient_id
       WHERE ri.recipe_id = $1
       ORDER BY i.name`,
      [recipeId]
    );

    return NextResponse.json({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      prepTime: recipe.prep_time,
      cookTime: recipe.cook_time,
      ingredients: ingredients.map(ing => ing.quantity || ing.name),
      instructions: instructions.map(i => i.instruction),
      difficulty: recipe.difficulty,
      servings: recipe.servings,
      country: recipe.country_code,
      countryName: recipe.country_name,
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
  // Require admin role
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const adminUser = authResult;

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

    // Get country_id
    const countryCode = validatedData.country || 'AR';
    const countryResult = await query<{ id: number }>(
      'SELECT id FROM countries WHERE code = $1',
      [countryCode.toUpperCase()]
    );
    
    if (countryResult.length === 0) {
      return NextResponse.json({ error: 'Invalid country code' }, { status: 400 });
    }
    
    const countryId = countryResult[0].id;

    // Use transaction for all updates
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update recipe
      await client.query(
        `UPDATE recipes 
         SET title = $1, prep_time = $2, cook_time = $3, difficulty = $4, servings = $5, country_id = $6, updated_at = CURRENT_TIMESTAMP
         WHERE id = $7`,
        [
          recipe.title,
          recipe.prepTime,
          recipe.cookTime,
          recipe.difficulty,
          recipe.servings ?? null,
          countryId,
          recipeId,
        ]
      );

      // Delete existing instructions
      await client.query('DELETE FROM instructions WHERE recipe_id = $1', [recipeId]);

      // Insert new instructions
      for (let i = 0; i < recipe.instructions.length; i++) {
        await client.query(
          `INSERT INTO instructions (recipe_id, step_number, instruction) 
           VALUES ($1, $2, $3)`,
          [recipeId, i + 1, recipe.instructions[i]]
        );
      }

      // Delete existing ingredient relationships
      await client.query('DELETE FROM recipe_ingredients WHERE recipe_id = $1', [recipeId]);

      // Insert new ingredients and relationships
      for (const ingredientName of recipe.ingredients) {
        const normalized = ingredientName.trim().toLowerCase();
        
        let ingredientId: number;
        try {
          const ingredientResult = await client.query<{ id: number }>(
            'INSERT INTO ingredients (name) VALUES ($1) RETURNING id',
            [normalized]
          );
          ingredientId = ingredientResult.rows[0].id;
        } catch (error: any) {
          if (error.code === '23505') {
            const existing = await client.query<{ id: number }>(
              'SELECT id FROM ingredients WHERE name = $1',
              [normalized]
            );
            ingredientId = existing.rows[0].id;
          } else {
            throw error;
          }
        }

        await client.query(
          `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) 
           VALUES ($1, $2, $3)`,
          [recipeId, ingredientId, ingredientName.substring(0, 150)]
        );
      }

      await client.query('COMMIT');

      // Log the action
      await logAuditEvent({
        user: adminUser,
        action: 'recipe_updated',
        resourceType: 'recipe',
        resourceId: recipeId.toString(),
        ipAddress: getIpAddress(request),
        userAgent: getUserAgent(request),
        details: { title: recipe.title }
      });

      return NextResponse.json({
        success: true,
        message: 'Recipe updated successfully',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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
  // Require admin role
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const adminUser = authResult;

  try {
    const { id } = await params;
    const recipeId = parseInt(id);

    if (isNaN(recipeId)) {
      return NextResponse.json({ error: 'Invalid recipe ID' }, { status: 400 });
    }

    // Check if recipe exists and get title for audit log
    const existing = await query<{ id: number; title: string }>(
      'SELECT id, title FROM recipes WHERE id = $1',
      [recipeId]
    );
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Delete recipe (CASCADE will handle recipe_ingredients and instructions)
    await execute('DELETE FROM recipes WHERE id = $1', [recipeId]);

    // Log the action
    await logAuditEvent({
      user: adminUser,
      action: 'recipe_deleted',
      resourceType: 'recipe',
      resourceId: recipeId.toString(),
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
      details: { title: existing[0].title }
    });

    return NextResponse.json({
      success: true,
      message: 'Recipe deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
