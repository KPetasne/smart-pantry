/**
 * Audit Logging System
 * Records all administrative actions for security and compliance
 */

import { query, execute } from './db';
import { AuthUser } from './auth-helpers';

export type AuditAction = 
  | 'user_created'
  | 'user_deleted'
  | 'recipe_created'
  | 'recipe_updated'
  | 'recipe_deleted'
  | 'recipe_image_deleted'
  | 'images_generated'
  | 'monthly_limit_reset'
  | 'script_executed'
  | 'login_success'
  | 'login_failed';

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  username: string | null;
  action: AuditAction;
  resource_type: string | null;
  resource_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  details: any;
  created_at: Date;
}

/**
 * Create the audit_logs table if it doesn't exist
 */
export async function initAuditLogsTable() {
  await execute(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(255) NULL,
      username VARCHAR(255) NULL,
      action VARCHAR(50) NOT NULL,
      resource_type VARCHAR(50) NULL,
      resource_id VARCHAR(255) NULL,
      ip_address VARCHAR(45) NULL,
      user_agent TEXT NULL,
      details JSONB NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes for better query performance
  await execute(`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
  `);
}

/**
 * Log an administrative action
 */
export async function logAuditEvent(params: {
  user: AuthUser | null;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
}): Promise<void> {
  try {
    await execute(
      `INSERT INTO audit_logs (
        user_id, 
        username, 
        action, 
        resource_type, 
        resource_id, 
        ip_address, 
        user_agent, 
        details
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        params.user?.id ? String(params.user.id) : null,
        params.user?.username || null,
        params.action,
        params.resourceType || null,
        params.resourceId || null,
        params.ipAddress || null,
        params.userAgent || null,
        params.details ? JSON.stringify(params.details) : null,
      ]
    );
  } catch (error) {
    // Don't throw - audit logging should never break the application
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Get IP address from request headers
 */
export function getIpAddress(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Get user agent from request headers
 */
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}

/**
 * Query audit logs with filters
 */
export async function getAuditLogs(params: {
  userId?: string;
  action?: AuditAction;
  resourceType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<AuditLogEntry[]> {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (params.userId) {
    conditions.push(`user_id = $${paramIndex++}`);
    values.push(params.userId);
  }

  if (params.action) {
    conditions.push(`action = $${paramIndex++}`);
    values.push(params.action);
  }

  if (params.resourceType) {
    conditions.push(`resource_type = $${paramIndex++}`);
    values.push(params.resourceType);
  }

  if (params.startDate) {
    conditions.push(`created_at >= $${paramIndex++}`);
    values.push(params.startDate);
  }

  if (params.endDate) {
    conditions.push(`created_at <= $${paramIndex++}`);
    values.push(params.endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = params.limit || 100;
  const offset = params.offset || 0;

  values.push(limit, offset);

  const logs = await query<AuditLogEntry>(
    `SELECT * FROM audit_logs 
     ${whereClause}
     ORDER BY created_at DESC 
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    values
  );

  return logs;
}
