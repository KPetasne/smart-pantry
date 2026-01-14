/**
 * Migration script to add role-based access control (RBAC) to admin_users table
 * Adds 'role' column with values: 'admin' or 'super_admin'
 * Default existing users to 'admin' role for backward compatibility
 */

import 'dotenv/config';
import { query } from '../lib/db';

async function addRoleColumn() {
  console.log('🔒 Starting RBAC migration...');

  try {
    // Check if column already exists
    const checkColumn = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'admin_users' 
      AND column_name = 'role'
    `);

    if (checkColumn.length > 0) {
      console.log('⚠️  Role column already exists. Skipping migration.');
      return;
    }

    // Add role column with default 'admin'
    await query(`
      ALTER TABLE admin_users
      ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'admin'
      CHECK (role IN ('admin', 'super_admin'))
    `);

    console.log('✅ Role column added successfully');

    // Optionally, promote the first user to super_admin
    const firstUser = await query(`
      SELECT id, username 
      FROM admin_users 
      ORDER BY created_at ASC 
      LIMIT 1
    `);

    if (firstUser.length > 0) {
      await query(`
        UPDATE admin_users 
        SET role = 'super_admin' 
        WHERE id = $1
      `, [firstUser[0].id]);

      console.log(`✅ Promoted first user '${firstUser[0].username}' to super_admin`);
    }

    // Display current role distribution
    const roleStats = await query(`
      SELECT role, COUNT(*) as count 
      FROM admin_users 
      GROUP BY role
    `);

    console.log('\n📊 Current role distribution:');
    roleStats.forEach(stat => {
      console.log(`   ${stat.role}: ${stat.count} user(s)`);
    });

    console.log('\n✅ RBAC migration completed successfully!');
    console.log('⚠️  IMPORTANT: Update your admin users with appropriate roles before deploying to production.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
addRoleColumn()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
