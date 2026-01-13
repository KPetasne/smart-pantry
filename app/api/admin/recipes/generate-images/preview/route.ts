import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';

// GET - Preview random recipes without images
export async function GET(request: Request) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const count = Math.min(parseInt(searchParams.get('count') || '5'), 10); // Max 10

  try {
    // Get random recipes without image_url
    const recipes = await query<{
      id: number;
      title: string;
      difficulty: string;
      country_code: string;
      country_name: string;
    }>(
      `SELECT r.id, r.title, r.difficulty, 
              c.code as country_code, c.name as country_name
       FROM recipes r
       INNER JOIN countries c ON r.country_id = c.id
       WHERE r.image_url IS NULL
       ORDER BY RANDOM()
       LIMIT $1`,
      [count]
    );

    if (recipes.length === 0) {
      return NextResponse.json({ 
        recipes: [],
        message: 'No recipes found without images'
      });
    }

    return NextResponse.json({
      recipes: recipes.map(r => ({
        id: r.id,
        title: r.title,
        difficulty: r.difficulty,
        country: r.country_code,
        countryName: r.country_name,
      })),
    });
  } catch (error) {
    console.error('Error fetching recipes for preview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
