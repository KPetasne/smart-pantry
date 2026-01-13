import { notFound } from 'next/navigation';
import RecipeDetail from '@/components/RecipeDetail';
import Link from 'next/link';
import { query } from '@/lib/db';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getRecipe(id: number) {
  try {
    const recipes = await query<{
      id: number;
      title: string;
      prep_time: number;
      cook_time: number;
      difficulty: string;
      servings: number | null;
      rating_count: number;
      rating_sum: number;
      average_rating: number;
      created_at: Date;
      image_url: string | null;
    }>(
      'SELECT id, title, prep_time, cook_time, difficulty, servings, rating_count, rating_sum, average_rating, created_at, image_url FROM recipes WHERE id = $1',
      [id]
    );

    if (recipes.length === 0) {
      return null;
    }

    const recipe = recipes[0];

    // Get instructions
    const instructions = await query<{ instruction: string }>(
      `SELECT instruction
       FROM instructions
       WHERE recipe_id = $1
       ORDER BY step_number`,
      [recipe.id]
    );

    // Get ingredients
    const ingredients = await query<{ quantity: string }>(
      `SELECT ri.quantity
       FROM recipe_ingredients ri
       WHERE ri.recipe_id = $1
       ORDER BY ri.ingredient_id`,
      [recipe.id]
    );

    return {
      id: recipe.id,
      title: recipe.title,
      prepTime: recipe.prep_time,
      cookTime: recipe.cook_time,
      ingredients: ingredients.map(ing => ing.quantity),
      instructions: instructions.map(i => i.instruction),
      difficulty: recipe.difficulty as 'easy' | 'medium' | 'hard',
      servings: recipe.servings ?? undefined,
      rating_count: recipe.rating_count,
      rating_sum: recipe.rating_sum,
      average_rating: recipe.average_rating,
      created_at: recipe.created_at.toISOString(),
      image_url: recipe.image_url ?? undefined,
    };
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return null;
  }
}

export default async function RecipePage({ params }: PageProps) {
  const resolvedParams = await params;
  const recipeId = parseInt(resolvedParams.id);

  if (isNaN(recipeId)) {
    notFound();
  }

  const recipe = await getRecipe(recipeId);

  if (!recipe) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-smoke to-white">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <Link href="/" className="text-terracota hover:text-terracota/90 mb-6 inline-block">
          ← Volver al inicio
        </Link>
        <RecipeDetail recipe={recipe} />
      </div>
    </main>
  );
}
