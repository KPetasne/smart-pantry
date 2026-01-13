import 'dotenv/config';
import { pool } from '../lib/db';

async function addImageColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting migration: adding image_url column and image_generation_log table...');
    
    await client.query('BEGIN');
    
    // Add image_url column to recipes table
    console.log('📊 Adding image_url column to recipes table...');
    await client.query(`
      ALTER TABLE recipes 
      ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
    `);
    
    // Create image_generation_log table
    console.log('📊 Creating image_generation_log table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS image_generation_log (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        generated_at TIMESTAMP DEFAULT NOW(),
        status VARCHAR(20) NOT NULL,
        error_message TEXT,
        CONSTRAINT fk_recipe
          FOREIGN KEY(recipe_id) 
          REFERENCES recipes(id)
      );
    `);
    
    // Create index for faster queries
    console.log('📊 Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_image_generation_log_generated_at 
      ON image_generation_log(generated_at);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_image_generation_log_recipe_id 
      ON image_generation_log(recipe_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_recipes_image_url 
      ON recipes(image_url);
    `);
    
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully!');
    console.log('📝 Added:');
    console.log('   - image_url column to recipes table');
    console.log('   - image_generation_log table');
    console.log('   - Indexes for performance');
    
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
addImageColumns()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
