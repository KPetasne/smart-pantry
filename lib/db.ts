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
  client_encoding: 'UTF8',
});

export interface Recipe {
  id: number;
  title: string;
  instructions: any; // JSONB
  difficulty: 'easy' | 'medium' | 'hard';
  rating_count?: number;
  rating_sum?: number;
  average_rating?: number;
  created_at: Date;
}

export interface Ingredient {
  id: number;
  name: string;
}

export interface RecipeIngredient {
  recipe_id: number;
  ingredient_id: number;
}

export interface SearchLead {
  id: number;
  email: string;
  created_at: Date;
}

// Database connection helper
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  try {
    const result = await pool.query(text, params);
    return result.rows as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Execute a single query without returning results
export async function execute(text: string, params?: any[]): Promise<void> {
  try {
    await pool.query(text, params);
  } catch (error) {
    console.error('Database execute error:', error);
    throw error;
  }
}
