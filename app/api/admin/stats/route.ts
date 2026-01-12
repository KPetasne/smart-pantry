import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';

export async function GET() {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Total recipes
    const totalResult = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM recipes'
    );
    const totalRecipes = parseInt(totalResult[0].count);

    // By difficulty
    const difficultyResult = await query<{ difficulty: string; count: string }>(
      `SELECT difficulty, COUNT(*) as count 
       FROM recipes 
       GROUP BY difficulty`
    );
    const byDifficulty = {
      easy: 0,
      medium: 0,
      hard: 0,
    };
    difficultyResult.forEach(row => {
      byDifficulty[row.difficulty as keyof typeof byDifficulty] = parseInt(row.count);
    });

    // By country
    const countryResult = await query<{ country_name: string; count: string }>(
      `SELECT c.name as country_name, COUNT(*) as count 
       FROM recipes r
       INNER JOIN countries c ON r.country_id = c.id
       GROUP BY c.name 
       ORDER BY count DESC`
    );
    const byCountry: { [key: string]: number } = {};
    countryResult.forEach(row => {
      byCountry[row.country_name] = parseInt(row.count);
    });

    return NextResponse.json({
      totalRecipes,
      byDifficulty,
      byCountry,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
