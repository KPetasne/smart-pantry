import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Pool } from 'pg';

// Rate limiter for voting
const rateLimitStore = new Map<string, number[]>();
const MAX_VOTES_PER_HOUR = 5;
const HOUR_MS = 60 * 60 * 1000;

function checkVoteRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempts = rateLimitStore.get(ip) || [];
  
  // Filter attempts within the last hour
  const recentAttempts = attempts.filter(timestamp => now - timestamp < HOUR_MS);
  
  if (recentAttempts.length >= MAX_VOTES_PER_HOUR) {
    return false; // Rate limited
  }
  
  // Add current attempt
  recentAttempts.push(now);
  rateLimitStore.set(ip, recentAttempts);
  
  return true; // Allowed
}

// Validation schema
const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  sessionId: z.string().uuid(),
});

// Database connection
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recipeId = parseInt(params.id);
    
    if (isNaN(recipeId)) {
      return NextResponse.json(
        { success: false, error: 'invalid_recipe_id' },
        { status: 400 }
      );
    }

    // Get IP address for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Check rate limit
    if (!checkVoteRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'rate_limit' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = ratingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'invalid_data', details: validation.error },
        { status: 400 }
      );
    }

    const { rating, sessionId } = validation.data;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if user has already voted
      const existingVote = await client.query(
        'SELECT id FROM recipe_ratings WHERE recipe_id = $1 AND session_id = $2',
        [recipeId, sessionId]
      );

      if (existingVote.rows.length > 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: 'already_voted' },
          { status: 400 }
        );
      }

      // Insert the rating
      await client.query(
        'INSERT INTO recipe_ratings (recipe_id, session_id, rating, ip_address) VALUES ($1, $2, $3, $4)',
        [recipeId, sessionId, rating, ip]
      );

      // Update recipe aggregated rating data
      await client.query(`
        UPDATE recipes 
        SET 
          rating_count = rating_count + 1,
          rating_sum = rating_sum + $1,
          average_rating = ROUND((rating_sum + $1)::numeric / (rating_count + 1), 2)
        WHERE id = $2
      `, [rating, recipeId]);

      // Get updated rating info
      const result = await client.query(
        'SELECT rating_count, average_rating FROM recipes WHERE id = $1',
        [recipeId]
      );

      await client.query('COMMIT');

      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'recipe_not_found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        average_rating: parseFloat(result.rows[0].average_rating),
        rating_count: result.rows[0].rating_count,
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Rating error:', error);
    return NextResponse.json(
      { success: false, error: 'server_error' },
      { status: 500 }
    );
  }
}
