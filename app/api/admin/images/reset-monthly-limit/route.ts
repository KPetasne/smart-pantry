import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/auth-helpers';
import { logAuditEvent, getIpAddress, getUserAgent } from '@/lib/audit-logger';

// POST - Reset monthly generation limit (delete current month's log)
export async function POST(request: Request) {
  // Require super_admin role for resetting limits
  const authResult = await requireSuperAdmin();
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const adminUser = authResult;

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

    // Log the action
    await logAuditEvent({
      user: adminUser,
      action: 'monthly_limit_reset',
      resourceType: 'image_generation_log',
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
      details: { deletedCount }
    });

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
