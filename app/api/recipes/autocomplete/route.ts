import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';

const autocompleteSchema = z.object({
  q: z.string().min(3).max(100),
  limit: z.number().int().min(1).max(10).default(10),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Validate query length
    if (q.length < 3) {
      return NextResponse.json([]);
    }

    const { q: searchQuery, limit: validLimit } = autocompleteSchema.parse({ q, limit });
    
    const results = await query<{
      id: number;
      title: string;
      difficulty: string;
      prep_time: number | null;
      cook_time: number | null;
      image_url: string | null;
    }>(
      `SELECT r.id, r.title, r.difficulty, r.prep_time, r.cook_time, r.image_url
       FROM recipes r
       WHERE r.title ILIKE $1
       ORDER BY r.average_rating DESC NULLS LAST, r.created_at DESC
       LIMIT $2`,
      [`%${searchQuery}%`, validLimit]
    );
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Autocomplete error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
