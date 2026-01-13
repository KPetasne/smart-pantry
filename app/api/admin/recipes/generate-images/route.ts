import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query, pool } from '@/lib/db';
import { z } from 'zod';
import { GeminiService } from '@/lib/gemini-service';
import { StorageService } from '@/lib/storage-service';

// Extend timeout for image generation (Vercel Pro allows up to 300s)
export const maxDuration = 300;

// Schema for batch image generation
const generateImagesSchema = z.object({
  recipeIds: z.array(z.number()).min(1).max(10),
});

interface GenerationResult {
  recipeId: number;
  title: string;
  success: boolean;
  imageUrl?: string;
  error?: string;
}

// POST - Generate images for selected recipes
export async function POST(request: Request) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = generateImagesSchema.parse(body);
    const { recipeIds } = validatedData;

    // Get monthly limit from environment
    const monthlyLimit = parseInt(process.env.IMAGE_GENERATION_MONTHLY_LIMIT || '100');

    // Check current month's generation count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count 
       FROM image_generation_log 
       WHERE generated_at >= date_trunc('month', CURRENT_DATE)
       AND status = 'success'`
    );
    
    const currentCount = parseInt(countResult[0].count);
    const remaining = monthlyLimit - currentCount;

    if (remaining < recipeIds.length) {
      return NextResponse.json({ 
        error: `Monthly limit exceeded. Only ${remaining} generations remaining this month.`,
        currentCount,
        monthlyLimit,
        remaining,
      }, { status: 400 });
    }

    // Fetch recipe details
    const recipes = await query<{
      id: number;
      title: string;
      country_code: string;
    }>(
      `SELECT r.id, r.title, c.code as country_code
       FROM recipes r
       INNER JOIN countries c ON r.country_id = c.id
       WHERE r.id = ANY($1)
       AND r.image_url IS NULL`,
      [recipeIds]
    );

    if (recipes.length === 0) {
      return NextResponse.json({ 
        error: 'No valid recipes found (they may already have images)'
      }, { status: 400 });
    }

    console.log(`🚀 Starting batch image generation for ${recipes.length} recipes...`);

    const results: GenerationResult[] = [];
    const geminiService = new GeminiService();

    // Process each recipe sequentially
    for (const recipe of recipes) {
      try {
        console.log(`\n📸 Processing recipe ${recipe.id}: ${recipe.title}`);

        // Get ingredients for this recipe
        const ingredientsResult = await query<{ quantity: string }>(
          `SELECT quantity 
           FROM recipe_ingredients ri
           WHERE ri.recipe_id = $1
           ORDER BY ri.id
           LIMIT 5`,
          [recipe.id]
        );

        const ingredients = ingredientsResult.map(i => i.quantity);

        // Generate image with Imagen 3
        const imageBuffer = await geminiService.generateRecipeImage(
          recipe.title,
          ingredients,
          recipe.country_code
        );

        // Upload compressed image to Supabase
        const filename = `recipe-${recipe.id}-${Date.now()}.jpg`;
        const imageUrl = await StorageService.uploadCompressedImage(imageBuffer, filename);

        // Update recipe with image URL
        await query(
          'UPDATE recipes SET image_url = $1 WHERE id = $2',
          [imageUrl, recipe.id]
        );

        // Log successful generation
        await query(
          `INSERT INTO image_generation_log (recipe_id, status) 
           VALUES ($1, 'success')`,
          [recipe.id]
        );

        results.push({
          recipeId: recipe.id,
          title: recipe.title,
          success: true,
          imageUrl,
        });

        console.log(`✅ Successfully generated image for recipe ${recipe.id}`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Failed to generate image for recipe ${recipe.id}:`, errorMessage);

        // Log failed generation with error message
        await query(
          `INSERT INTO image_generation_log (recipe_id, status, error_message) 
           VALUES ($1, 'error', $2)`,
          [recipe.id, errorMessage]
        );

        results.push({
          recipeId: recipe.id,
          title: recipe.title,
          success: false,
          error: errorMessage,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`\n🎉 Batch completed: ${successCount} successful, ${failCount} failed`);

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failCount,
        newCount: currentCount + successCount,
        monthlyLimit,
        remaining: remaining - successCount,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: error.errors 
      }, { status: 400 });
    }

    console.error('Error in batch image generation:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET - Get current month's generation stats
export async function GET() {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const monthlyLimit = parseInt(process.env.IMAGE_GENERATION_MONTHLY_LIMIT || '100');

    // Get current month's stats
    const statsResult = await query<{ 
      total: string;
      successful: string;
      failed: string;
    }>(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'success') as successful,
        COUNT(*) FILTER (WHERE status = 'error') as failed
       FROM image_generation_log 
       WHERE generated_at >= date_trunc('month', CURRENT_DATE)`
    );

    const stats = statsResult[0];
    const successfulCount = parseInt(stats.successful);

    return NextResponse.json({
      currentCount: successfulCount,
      monthlyLimit,
      remaining: Math.max(0, monthlyLimit - successfulCount),
      total: parseInt(stats.total),
      successful: successfulCount,
      failed: parseInt(stats.failed),
    });
  } catch (error) {
    console.error('Error fetching generation stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
