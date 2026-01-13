'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const countries = ['argentina', 'mexico', 'spain', 'italy', 'china', 'japan', 'peru', 'usa'];

interface EditRecipePageProps {
  params: Promise<{ id: string }>;
}

export default function EditRecipePage({ params }: EditRecipePageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [deletingImage, setDeletingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    ingredients: '',
    instructions: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    servings: undefined as number | undefined,
    language: 'es',
    country: 'argentina',
  });

  useEffect(() => {
    fetchRecipe(resolvedParams.id);
  }, [resolvedParams.id]);

  const fetchRecipe = async (recipeId: string) => {
    try {
      const response = await fetch(`/api/admin/recipes/${recipeId}`);
      if (!response.ok) {
        throw new Error('Receta no encontrada');
      }

      const recipe = await response.json();
      setFormData({
        title: recipe.title,
        ingredients: recipe.ingredients.join('\n'),
        instructions: recipe.instructions.join('\n'),
        difficulty: recipe.difficulty,
        servings: recipe.servings,
        language: recipe.language,
        country: recipe.country,
      });
      setImageUrl(recipe.image_url || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la receta');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
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

      const response = await fetch(`/api/admin/recipes/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          ingredients,
          instructions,
          difficulty: formData.difficulty,
          servings: formData.servings,
          language: formData.language,
          country: formData.country,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al actualizar la receta');
      }

      router.push('/admin/recipes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la receta');
      setLoading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar la imagen de esta receta?')) {
      return;
    }

    setDeletingImage(true);
    
    try {
      const response = await fetch(`/api/admin/recipes/${resolvedParams.id}/delete-image`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la imagen');
      }

      setImageUrl(null);
      alert('Imagen eliminada exitosamente');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar la imagen');
    } finally {
      setDeletingImage(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/recipes" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Volver a la lista
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">Editar Receta</h1>
      </div>

      {/* Image Section */}
      {imageUrl && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Imagen de la Receta</h2>
          <div className="flex items-start gap-4">
            <img
              src={imageUrl}
              alt="Recipe preview"
              className="w-48 h-36 object-cover rounded-lg"
            />
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-3">
                Esta receta tiene una imagen generada por IA. Puedes eliminarla si deseas generar una nueva.
              </p>
              <button
                type="button"
                onClick={handleDeleteImage}
                disabled={deletingImage}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
              >
                {deletingImage ? 'Eliminando...' : 'Eliminar Imagen'}
              </button>
            </div>
          </div>
        </div>
      )}

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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <label htmlFor="servings" className="block text-sm font-medium text-gray-700 mb-2">
                Porciones
              </label>
              <input
                type="number"
                id="servings"
                value={formData.servings ?? ''}
                onChange={(e) => setFormData({ ...formData, servings: e.target.value ? parseInt(e.target.value) : undefined })}
                min="1"
                max="12"
                placeholder="1-12"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
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
                  <option key={country} value={country} className="capitalize">
                    {country}
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
              {loading ? 'Guardando...' : 'Guardar Cambios'}
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
