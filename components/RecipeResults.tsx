'use client';

import RecipeCard from './RecipeCard';

interface Recipe {
  id: number;
  title: string;
  prepTime?: number;
  cookTime?: number;
  ingredients: string[];
  instructions: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  servings?: number;
  created_at: string;
  fromCache?: boolean;
}

interface RecipeResultsProps {
  recipes: Recipe[];
  loading?: boolean;
}

export default function RecipeResults({ recipes, loading }: RecipeResultsProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracota"></div>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="text-center py-12 text-carbon/70">
        <p>No se encontraron recetas. Intenta con otros ingredientes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recipes.map((recipe) => (
        <div key={recipe.id} className="relative">
          <RecipeCard
            id={recipe.id}
            title={recipe.title}
            prepTime={recipe.prepTime}
            cookTime={recipe.cookTime}
            ingredients={recipe.ingredients}
            difficulty={recipe.difficulty}
            servings={recipe.servings}
          />
          {recipe.fromCache !== undefined && (
            <div className="absolute top-2 right-2">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {recipe.fromCache ? 'Desde cache' : 'Nueva receta'}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
