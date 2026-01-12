import 'dotenv/config';
import { pool } from '../lib/db';

async function addTimeColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting migration: adding prep_time and cook_time columns...');
    
    await client.query('BEGIN');
    
    // Add time columns to recipes table
    console.log('📊 Adding prep_time and cook_time columns to recipes table...');
    await client.query(`
      ALTER TABLE recipes 
      ADD COLUMN IF NOT EXISTS prep_time INT,
      ADD COLUMN IF NOT EXISTS cook_time INT;
    `);
    
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully!');
    console.log('📝 Columns prep_time and cook_time added to recipes table');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
addTimeColumns()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
