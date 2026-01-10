'use client';

import { useState } from 'react';
import RecipeCard from './RecipeCard';

interface Recipe {
  id: number;
  title: string;
  ingredients: string[];
  instructions: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
}

export default function QuickFilters() {
  const [selectedDiet, setSelectedDiet] = useState<'carnivore' | 'vegan' | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilter = async () => {
    if (!selectedDiet && !selectedDifficulty) {
      setError('Selecciona al menos un filtro');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/recipes/filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          diet: selectedDiet || undefined,
          difficulty: selectedDifficulty || undefined,
          limit: 3,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch filtered recipes');
      }

      const data = await response.json();
      setRecipes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Filtros Rápidos</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Dieta</label>
            <div className="flex gap-4">
              <button
                onClick={() => setSelectedDiet(selectedDiet === 'carnivore' ? null : 'carnivore')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedDiet === 'carnivore'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Carnívoro
              </button>
              <button
                onClick={() => setSelectedDiet(selectedDiet === 'vegan' ? null : 'vegan')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedDiet === 'vegan'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Vegano
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Dificultad</label>
            <div className="flex gap-4">
              {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                <button
                  key={difficulty}
                  onClick={() => setSelectedDifficulty(selectedDifficulty === difficulty ? null : difficulty)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedDifficulty === difficulty
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {difficulty === 'easy' ? 'Fácil' : difficulty === 'medium' ? 'Medio' : 'Difícil'}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleFilter}
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Buscando...' : 'Buscar Recetas'}
          </button>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
        </div>
      </div>

      {recipes.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Resultados</h3>
          <div className="space-y-4">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                id={recipe.id}
                title={recipe.title}
                ingredients={recipe.ingredients}
                difficulty={recipe.difficulty}
              />
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}
