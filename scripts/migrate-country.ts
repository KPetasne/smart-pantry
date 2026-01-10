import { execute } from '../lib/db';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  try {
    console.log('🔄 Running migration: add country column...');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrate-add-country.sql'),
      'utf-8'
    );
    
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      await execute(statement);
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('📝 Next step: Run "npm run seed" to generate Argentine recipes');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
