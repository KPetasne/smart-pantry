import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';
import { StorageService } from '@/lib/storage-service';

// DELETE - Delete image from a recipe
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const recipeId = parseInt(params.id);

    if (isNaN(recipeId)) {
      return NextResponse.json({ error: 'Invalid recipe ID' }, { status: 400 });
    }

    // Get current image URL
    const recipeResult = await query<{ image_url: string | null }>(
      'SELECT image_url FROM recipes WHERE id = $1',
      [recipeId]
    );

    if (recipeResult.length === 0) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    const imageUrl = recipeResult[0].image_url;

    if (!imageUrl) {
      return NextResponse.json({ error: 'Recipe has no image' }, { status: 400 });
    }

    // Delete from Supabase Storage
    await StorageService.deleteImage(imageUrl);

    // Update database
    await query(
      'UPDATE recipes SET image_url = NULL WHERE id = $1',
      [recipeId]
    );

    console.log(`✅ Deleted image for recipe ${recipeId}`);

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
