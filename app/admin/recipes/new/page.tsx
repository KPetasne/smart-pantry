'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const countries = ['argentina', 'mexico', 'spain', 'italy', 'china', 'japan', 'peru', 'usa', 'medio-oriente'];

const countryNames: { [key: string]: string } = {
  'argentina': 'Argentina',
  'mexico': 'México',
  'spain': 'España',
  'italy': 'Italia',
  'china': 'China',
  'japan': 'Japón',
  'peru': 'Perú',
  'usa': 'USA',
  'medio-oriente': 'Medio Oriente'
};

export default function NewRecipePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    ingredients: '',
    instructions: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    language: 'es',
    country: 'argentina',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Parse ingredients and instructions
      const ingredients = formData.ingredients
        .split('\n')
        .map(i => i.trim())
        .filter(i => i.length > 0);

      const instructions = formData.instructions
        .split('\n')
        .map(i => i.trim())
        .filter(i => i.length > 0);

      if (ingredients.length === 0) {
        setError('Debes agregar al menos un ingrediente');
        setLoading(false);
        return;
      }

      if (instructions.length === 0) {
        setError('Debes agregar al menos una instrucción');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          ingredients,
          instructions,
          difficulty: formData.difficulty,
          language: formData.language,
          country: formData.country,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al crear la receta');
      }

      router.push('/admin/recipes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la receta');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/recipes" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Volver a la lista
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">Nueva Receta</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>

          <div>
            <label htmlFor="ingredients" className="block text-sm font-medium text-gray-700 mb-2">
              Ingredientes * (uno por línea)
            </label>
            <textarea
              id="ingredients"
              value={formData.ingredients}
              onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
              required
              rows={8}
              placeholder="500g de carne picada&#10;2 cebollas grandes&#10;3 dientes de ajo"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-mono"
            />
          </div>

          <div>
            <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
              Instrucciones * (una por línea)
            </label>
            <textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              required
              rows={10}
              placeholder="Picar las cebollas finamente&#10;Rehogar en aceite hasta dorar&#10;Agregar la carne y cocinar"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
                Dificultad *
              </label>
              <select
                id="difficulty"
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="easy">Fácil</option>
                <option value="medium">Medio</option>
                <option value="hard">Difícil</option>
              </select>
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                País *
              </label>
              <select
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 capitalize"
              >
                {countries.map(country => (
                  <option key={country} value={country}>
                    {countryNames[country]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                Idioma *
              </label>
              <select
                id="language"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : 'Crear Receta'}
            </button>
            <Link
              href="/admin/recipes"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold text-center text-gray-700"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
