import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';

const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = subscribeSchema.parse(body);

    // Insert email into search_leads table
    try {
      await query(
        `INSERT INTO search_leads (email) 
         VALUES ($1) 
         ON CONFLICT (email) DO NOTHING 
         RETURNING id`,
        [email.toLowerCase().trim()]
      );

      return NextResponse.json({
        success: true,
        message: 'Successfully subscribed to the waitlist',
      });
    } catch (error: any) {
      // If it's a unique constraint violation, that's okay - they're already subscribed
      if (error.code === '23505') {
        return NextResponse.json({
          success: true,
          message: 'You are already subscribed',
        });
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in subscribe endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
