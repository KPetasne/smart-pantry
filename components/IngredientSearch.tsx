'use client';

import { useState } from 'react';

interface IngredientSearchProps {
  onSearch: (ingredients: string[]) => void;
  loading?: boolean;
}

export default function IngredientSearch({ onSearch, loading = false }: IngredientSearchProps) {
  const [ingredients, setIngredients] = useState<string[]>(['', '']);
  const [error, setError] = useState<string | null>(null);

  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
    setError(null);
  };

  const addIngredientField = () => {
    if (ingredients.length < 3) {
      setIngredients([...ingredients, '']);
    }
  };

  const removeIngredientField = (index: number) => {
    if (ingredients.length > 2) {
      const newIngredients = ingredients.filter((_, i) => i !== index);
      setIngredients(newIngredients);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validIngredients = ingredients.filter(ing => ing.trim().length > 0);
    
    if (validIngredients.length < 1) {
      setError('Ingresa al menos un ingrediente');
      return;
    }

    if (validIngredients.length > 3) {
      setError('Máximo 3 ingredientes');
      return;
    }

    setError(null);
    onSearch(validIngredients);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        {ingredients.map((ingredient, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={ingredient}
              onChange={(e) => handleIngredientChange(index, e.target.value)}
              placeholder={`Ingrediente ${index + 1}`}
              className="flex-1 px-4 py-2 border border-salvia/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota text-carbon placeholder-gray-400"
              disabled={loading}
            />
            {ingredients.length > 2 && (
              <button
                type="button"
                onClick={() => removeIngredientField(index)}
                className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                disabled={loading}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {ingredients.length < 3 && (
        <button
          type="button"
          onClick={addIngredientField}
          className="text-terracota hover:text-terracota/80 text-sm"
          disabled={loading}
        >
          + Agregar otro ingrediente
        </button>
      )}

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-terracota text-white rounded-lg hover:bg-terracota/90 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Buscando...' : 'Buscar Receta'}
      </button>
    </form>
  );
}
