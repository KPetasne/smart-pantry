import 'dotenv/config';
import { query, execute } from '../lib/db';

type LogFunction = (message: string) => void;

export async function removeEmptyRecipes(log: LogFunction = console.log) {
  log('Searching for recipes without ingredients...');
  
  // Find recipes without ingredients
  const emptyRecipes = await query<{
    id: number;
    title: string;
    ingredient_count: string;
  }>(`
    SELECT 
      r.id,
      r.title,
      COUNT(ri.ingredient_id) as ingredient_count
    FROM recipes r
    LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
    GROUP BY r.id, r.title
    HAVING COUNT(ri.ingredient_id) = 0
    ORDER BY r.id
  `);

  if (emptyRecipes.length === 0) {
    log('No empty recipes found.');
    return;
  }

  log(`Found ${emptyRecipes.length} recipes without ingredients.`);
  
  let deletedCount = 0;

  for (const recipe of emptyRecipes) {
    log(`Deleting "${recipe.title}" (ID: ${recipe.id})...`);
    
    // Delete recipe (CASCADE will handle instructions)
    await execute('DELETE FROM recipes WHERE id = $1', [recipe.id]);
    deletedCount++;
  }

  log(`\n✓ Deleted ${deletedCount} empty recipes.`);
  
  // Show final count
  const final = await query<{ count: string }>('SELECT COUNT(*) as count FROM recipes');
  log(`Total recipes remaining: ${final[0].count}`);
}

async function main() {
  try {
    await removeEmptyRecipes();
    process.exit(0);
  } catch (error) {
    console.error('Error removing empty recipes:', error);
    process.exit(1);
  }
}

// Only run main if called directly
if (require.main === module) {
  main();
}
