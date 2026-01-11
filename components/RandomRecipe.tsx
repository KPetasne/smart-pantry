'use client';

import { useState, useEffect } from 'react';
import RecipeCard from './RecipeCard';

interface Recipe {
  id: number;
  title: string;
  ingredients: string[];
  instructions: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  servings?: number;
  created_at: string;
}

export default function RandomRecipe() {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRandomRecipe = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/recipes/random');
      if (!response.ok) {
        throw new Error('Failed to fetch recipe');
      }
      const data = await response.json();
      setRecipe(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomRecipe();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <p>Error: {error}</p>
        <button
          onClick={fetchRandomRecipe}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!recipe) {
    return null;
  }

  return (
    <div>
      <RecipeCard
        id={recipe.id}
        title={recipe.title}
        ingredients={recipe.ingredients}
        difficulty={recipe.difficulty}
        servings={recipe.servings}
      />
      <div className="mt-4 text-center">
        <button
          onClick={fetchRandomRecipe}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Otra opción
        </button>
      </div>
    </div>
  );
}
