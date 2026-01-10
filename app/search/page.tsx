'use client';

import { useState } from 'react';
import IngredientSearch from '@/components/IngredientSearch';
import RecipeResults from '@/components/RecipeResults';
import Link from 'next/link';

interface Recipe {
  id: number;
  title: string;
  ingredients: string[];
  instructions: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
  fromCache?: boolean;
}

export default function SearchPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (ingredients: string[]) => {
    setLoading(true);
    setError(null);
    setRecipes([]);

    try {
      const response = await fetch('/api/recipes/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ingredients }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search recipes');
      }

      const data = await response.json();
      setRecipes([data]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link href="/" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
              ← Volver al inicio
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Buscar Receta por Ingredientes
            </h1>
            <p className="text-gray-600">
              Ingresa 2-3 ingredientes que tengas disponibles y encuentra la receta perfecta
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <IngredientSearch onSearch={handleSearch} loading={loading} />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-6">
              {error}
            </div>
          )}

          <RecipeResults recipes={recipes} loading={loading} />
        </div>
      </div>
    </main>
  );
}
