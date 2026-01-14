/**
 * Initialize audit logging table
 * Run this script to create the audit_logs table in the database
 */

import 'dotenv/config';
import { initAuditLogsTable } from '../lib/audit-logger';

async function init() {
  console.log('🔒 Initializing audit logging system...');

  try {
    await initAuditLogsTable();
    console.log('✅ Audit logs table created successfully!');
    console.log('\nThe following indexes were created for performance:');
    console.log('  - idx_audit_logs_user_id');
    console.log('  - idx_audit_logs_action');
    console.log('  - idx_audit_logs_created_at');
    console.log('  - idx_audit_logs_resource');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to initialize audit logs:', error);
    process.exit(1);
  }
}

init();
