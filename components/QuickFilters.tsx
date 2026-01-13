'use client';

import { useState } from 'react';
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
}

export default function QuickFilters() {
  const [selectedDiet, setSelectedDiet] = useState<'carnivore' | 'vegan' | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleFilter = async () => {
    if (!selectedDiet && !selectedDifficulty) {
      setError('Selecciona al menos un filtro');
      return;
    }

    setRecipes([]);
    setLoading(true);
    setError(null);
    setHasSearched(true);

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
        <h2 className="text-2xl font-bold mb-4 text-carbon">Filtros Rápidos</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-carbon mb-2">Dieta</label>
            <div className="flex gap-4">
              <button
                onClick={() => setSelectedDiet(selectedDiet === 'carnivore' ? null : 'carnivore')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedDiet === 'carnivore'
                    ? 'bg-terracota text-white'
                    : 'bg-blancoCrema text-carbon hover:bg-carbon/10'
                }`}
              >
                Carnívoro
              </button>
              <button
                onClick={() => setSelectedDiet(selectedDiet === 'vegan' ? null : 'vegan')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedDiet === 'vegan'
                    ? 'bg-terracota text-white'
                    : 'bg-blancoCrema text-carbon hover:bg-carbon/10'
                }`}
              >
                Vegano
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-carbon mb-2">Dificultad</label>
            <div className="flex gap-4">
              {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                <button
                  key={difficulty}
                  onClick={() => setSelectedDifficulty(selectedDifficulty === difficulty ? null : difficulty)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedDifficulty === difficulty
                      ? 'bg-terracota text-white'
                      : 'bg-blancoCrema text-carbon hover:bg-carbon/10'
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
            className="w-full px-6 py-3 bg-terracota text-white rounded-lg hover:bg-terracota/90 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
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
          <h3 className="text-xl font-semibold mb-4 text-carbon">Resultados</h3>
          <div>
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                id={recipe.id}
                title={recipe.title}
                prepTime={recipe.prepTime}
                cookTime={recipe.cookTime}
                ingredients={recipe.ingredients}
                difficulty={recipe.difficulty}
                servings={recipe.servings}
              />
            ))}
          </div>
        </div>
      )}

      {!loading && hasSearched && recipes.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-semibold">No se encontraron recetas con estos filtros</p>
          <p className="text-yellow-600 text-sm mt-2">Intenta con otros criterios de búsqueda</p>
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracota"></div>
        </div>
      )}
    </div>
  );
}
