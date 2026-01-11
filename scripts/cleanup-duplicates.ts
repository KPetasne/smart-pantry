import 'dotenv/config';
import { query, execute } from '../lib/db';

type LogFunction = (message: string) => void;

export async function removeDuplicateRecipes(log: LogFunction = console.log) {
  log('Searching for duplicate recipes...');
  
  // Find duplicate recipes by title
  const duplicates = await query<{
    title: string;
    count: number;
    ids: number[];
  }>(`
    SELECT 
      title,
      COUNT(*) as count,
      ARRAY_AGG(id ORDER BY created_at DESC) as ids
    FROM recipes
    GROUP BY title
    HAVING COUNT(*) > 1
    ORDER BY count DESC
  `);

  if (duplicates.length === 0) {
    log('No duplicate recipes found.');
    return;
  }

  log(`Found ${duplicates.length} duplicate recipe titles.`);
  
  let deletedCount = 0;

  for (const dup of duplicates) {
    // Keep the most recent one (first in ids array), delete the rest
    const idsToDelete = dup.ids.slice(1);
    
    log(`"${dup.title}": ${dup.count} copies, keeping ID ${dup.ids[0]}, deleting ${idsToDelete.length} older copies...`);
    
    for (const id of idsToDelete) {
      await execute('DELETE FROM recipes WHERE id = $1', [id]);
      deletedCount++;
    }
  }

  log(`\n✓ Deleted ${deletedCount} duplicate recipes.`);
  
  // Show final count
  const final = await query<{ count: string }>('SELECT COUNT(*) as count FROM recipes');
  log(`Total recipes remaining: ${final[0].count}`);
}

async function main() {
  try {
    await removeDuplicateRecipes();
    process.exit(0);
  } catch (error) {
    console.error('Error removing duplicates:', error);
    process.exit(1);
  }
}

// Only run main if called directly
if (require.main === module) {
  main();
}
