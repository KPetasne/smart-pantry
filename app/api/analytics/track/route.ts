import { NextResponse } from 'next/server';
import { trackSearch } from '@/lib/analytics';
import { z } from 'zod';

const trackSchema = z.object({
  ingredients: z.array(z.string().min(1)).min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ingredients } = trackSchema.parse(body);

    await trackSearch(ingredients);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in analytics track endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
