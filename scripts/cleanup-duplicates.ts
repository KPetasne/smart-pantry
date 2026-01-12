import 'dotenv/config';
import { query, execute } from '../lib/db';
import { areSimilar } from '@/lib/string-similarity';

type LogFunction = (message: string) => void;

export async function removeDuplicateRecipes(log: LogFunction = console.log) {
  log('Searching for duplicate and similar recipes...');
  
  // Get all recipes
  const allRecipes = await query<{
    id: number;
    title: string;
    created_at: Date;
  }>(`
    SELECT id, title, created_at
    FROM recipes
    ORDER BY created_at DESC
  `);

  if (allRecipes.length === 0) {
    log('No recipes found.');
    return;
  }

  log(`Analyzing ${allRecipes.length} recipes for duplicates and similarity...`);
  
  const toDelete = new Set<number>();
  const groups: Map<number, number[]> = new Map();

  // Compare each recipe with all others
  for (let i = 0; i < allRecipes.length; i++) {
    if (toDelete.has(allRecipes[i].id)) continue;
    
    const similarIds: number[] = [];
    
    for (let j = i + 1; j < allRecipes.length; j++) {
      if (toDelete.has(allRecipes[j].id)) continue;
      
      // Check if titles are similar (80% threshold)
      if (areSimilar(allRecipes[i].title, allRecipes[j].title, 0.8)) {
        similarIds.push(allRecipes[j].id);
        toDelete.add(allRecipes[j].id);
      }
    }
    
    if (similarIds.length > 0) {
      groups.set(allRecipes[i].id, similarIds);
    }
  }

  if (toDelete.size === 0) {
    log('No duplicate or similar recipes found.');
    return;
  }

  log(`\nFound ${groups.size} groups of similar recipes (${toDelete.size} duplicates to remove):`);
  
  let deletedCount = 0;

  for (const [keepId, deleteIds] of groups.entries()) {
    const kept = allRecipes.find(r => r.id === keepId);
    const deleted = allRecipes.filter(r => deleteIds.includes(r.id));
    
    log(`\nKeeping: "${kept?.title}" (ID: ${keepId})`);
    log(`Deleting ${deleteIds.length} similar recipe(s):`);
    
    for (const delRecipe of deleted) {
      log(`  - "${delRecipe.title}" (ID: ${delRecipe.id})`);
      await execute('DELETE FROM recipes WHERE id = $1', [delRecipe.id]);
      deletedCount++;
    }
  }

  log(`\n✓ Deleted ${deletedCount} duplicate/similar recipes.`);
  
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
