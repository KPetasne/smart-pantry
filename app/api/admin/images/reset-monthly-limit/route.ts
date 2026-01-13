import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';

// POST - Reset monthly generation limit (delete current month's log)
export async function POST() {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Delete current month's generation log
    const result = await query<{ count: string }>(
      `WITH deleted AS (
        DELETE FROM image_generation_log 
        WHERE generated_at >= date_trunc('month', CURRENT_DATE)
        RETURNING *
      )
      SELECT COUNT(*) as count FROM deleted`
    );

    const deletedCount = parseInt(result[0].count);

    console.log(`🔄 Reset monthly limit: ${deletedCount} log entries deleted`);

    return NextResponse.json({
      success: true,
      message: `Monthly limit reset successfully. ${deletedCount} log entries deleted.`,
      deletedCount,
    });

  } catch (error) {
    console.error('Error resetting monthly limit:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
