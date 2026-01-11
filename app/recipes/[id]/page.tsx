import { notFound } from 'next/navigation';
import RecipeDetail from '@/components/RecipeDetail';
import Link from 'next/link';
import { query } from '@/lib/db';

interface PageProps {
  params: { id: string };
}

async function getRecipe(id: number) {
  try {
    const recipes = await query<{
      id: number;
      title: string;
      instructions: any;
      difficulty: string;
      created_at: Date;
    }>(
      'SELECT id, title, instructions, difficulty, created_at FROM recipes WHERE id = $1',
      [id]
    );

    if (recipes.length === 0) {
      return null;
    }

    const recipe = recipes[0];

    // Get ingredients
    const ingredients = await query<{ name: string }>(
      `SELECT i.name 
       FROM ingredients i
       INNER JOIN recipe_ingredients ri ON i.id = ri.ingredient_id
       WHERE ri.recipe_id = $1
       ORDER BY i.name`,
      [recipe.id]
    );

    return {
      id: recipe.id,
      title: recipe.title,
      ingredients: ingredients.map(ing => ing.name),
      instructions: Array.isArray(recipe.instructions) 
        ? recipe.instructions 
        : typeof recipe.instructions === 'string' 
          ? JSON.parse(recipe.instructions) 
          : [],
      difficulty: recipe.difficulty as 'easy' | 'medium' | 'hard',
      created_at: recipe.created_at.toISOString(),
    };
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return null;
  }
}

export default async function RecipePage({ params }: PageProps) {
  const recipeId = parseInt(params.id);

  if (isNaN(recipeId)) {
    notFound();
  }

  const recipe = await getRecipe(recipeId);

  if (!recipe) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <Link href="/" className="text-blue-600 hover:text-blue-700 mb-6 inline-block">
          ← Volver al inicio
        </Link>
        <RecipeDetail recipe={recipe} />
      </div>
    </main>
  );
}
