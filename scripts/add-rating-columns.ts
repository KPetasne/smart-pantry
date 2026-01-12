import 'dotenv/config';
import { Pool } from 'pg';

// Support both DATABASE_URL (standard) and POSTGRES_URL (Vercel default)
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL or POSTGRES_URL environment variable is required. ' +
    'Please set one of them in your .env.local file.'
  );
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
});

async function addRatingColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database migration: adding rating columns...');
    
    await client.query('BEGIN');
    
    // Add rating columns to recipes table
    console.log('📊 Adding rating columns to recipes table...');
    await client.query(`
      ALTER TABLE recipes 
      ADD COLUMN IF NOT EXISTS rating_count INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS rating_sum INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00;
    `);
    
    // Create recipe_ratings table
    console.log('📝 Creating recipe_ratings table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS recipe_ratings (
        id SERIAL PRIMARY KEY,
        recipe_id INT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        session_id VARCHAR(255) NOT NULL,
        rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create indexes for performance
    console.log('🔍 Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe_session 
      ON recipe_ratings(recipe_id, session_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_recipe_ratings_created_at 
      ON recipe_ratings(created_at);
    `);
    
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully!');
    console.log('📈 All recipes now have rating columns initialized to 0');
    
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
addRatingColumns().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
