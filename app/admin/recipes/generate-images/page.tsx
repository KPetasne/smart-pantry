'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PreviewRecipe {
  id: number;
  title: string;
  difficulty: string;
  country: string;
  countryName: string;
}

interface GenerationResult {
  recipeId: number;
  title: string;
  success: boolean;
  imageUrl?: string;
  error?: string;
}

interface Stats {
  currentCount: number;
  monthlyLimit: number;
  remaining: number;
  successful: number;
  failed: number;
}

export default function GenerateImagesPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [count, setCount] = useState(5);
  const [previewRecipes, setPreviewRecipes] = useState<PreviewRecipe[]>([]);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stage, setStage] = useState<'input' | 'preview' | 'results'>('input');

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/recipes/generate-images');
      if (!response.ok) throw new Error('Failed to load stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handlePreview = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/admin/recipes/generate-images/preview?count=${count}`);
      
      if (!response.ok) {
        throw new Error('Failed to load preview');
      }

      const data = await response.json();
      
      if (data.recipes.length === 0) {
        setError('No se encontraron recetas sin imágenes');
        setLoading(false);
        return;
      }

      setPreviewRecipes(data.recipes);
      setStage('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar preview');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    
    try {
      const recipeIds = previewRecipes.map(r => r.id);
      
      const response = await fetch('/api/admin/recipes/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeIds }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate images');
      }

      const data = await response.json();
      setResults(data.results);
      setStage('results');
      
      // Reload stats
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar imágenes');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStage('input');
    setPreviewRecipes([]);
    setResults([]);
    setError('');
  };

  const handleResetLimit = async () => {
    if (!confirm('¿Estás seguro de que quieres resetear el límite mensual? Esto eliminará el registro de generaciones del mes actual.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/images/reset-monthly-limit', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to reset limit');
      }

      alert('Límite mensual reseteado exitosamente');
      await loadStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al resetear límite');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/recipes" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Volver a la lista
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">Generar Imágenes de Recetas</h1>
        <p className="text-gray-600 mt-2">
          Genera imágenes automáticas para recetas usando IA
        </p>
      </div>

      {/* Stats Card */}
      {stats && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Estadísticas del Mes</h2>
            <button
              onClick={handleResetLimit}
              className="text-sm text-red-600 hover:text-red-700 underline"
            >
              Resetear límite mensual
            </button>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.currentCount}</div>
              <div className="text-sm text-gray-600">Generadas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.remaining}</div>
              <div className="text-sm text-gray-600">Disponibles</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">{stats.monthlyLimit}</div>
              <div className="text-sm text-gray-600">Límite Mensual</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-sm text-gray-600">Errores</div>
            </div>
          </div>
        </div>
      )}

      {/* Input Stage */}
      {stage === 'input' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Seleccionar cantidad de recetas
          </h2>
          
          <div className="mb-6">
            <label htmlFor="count" className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad de recetas a generar (máximo 10)
            </label>
            <input
              type="number"
              id="count"
              min="1"
              max="10"
              value={count}
              onChange={(e) => setCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            <p className="text-sm text-gray-500 mt-1">
              Se seleccionarán {count} recetas aleatorias sin imagen
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handlePreview}
            disabled={loading || (stats !== null && stats.remaining < count)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Cargando...' : 'Previsualizar Recetas'}
          </button>

          {stats !== null && stats.remaining < count && (
            <p className="text-sm text-red-600 mt-2">
              No hay suficientes generaciones disponibles este mes
            </p>
          )}
        </div>
      )}

      {/* Preview Stage */}
      {stage === 'preview' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Recetas Seleccionadas ({previewRecipes.length})
          </h2>

          <div className="mb-6 max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">ID</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Título</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">País</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Dificultad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {previewRecipes.map((recipe) => (
                  <tr key={recipe.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">{recipe.id}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{recipe.title}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{recipe.countryName}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        recipe.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        recipe.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {recipe.difficulty}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleReset}
              disabled={loading}
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Generando...' : 'Generar Imágenes'}
            </button>
          </div>

          {loading && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
              ⏳ Generando imágenes... Esto puede tomar varios minutos.
            </div>
          )}
        </div>
      )}

      {/* Results Stage */}
      {stage === 'results' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Resultados de Generación
          </h2>

          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">{results.length}</div>
              <div className="text-sm text-gray-600">Total Procesadas</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {results.filter(r => r.success).length}
              </div>
              <div className="text-sm text-gray-600">Exitosas</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {results.filter(r => !r.success).length}
              </div>
              <div className="text-sm text-gray-600">Fallidas</div>
            </div>
          </div>

          <div className="mb-6 max-h-96 overflow-y-auto">
            <div className="space-y-4">
              {results.map((result) => (
                <div
                  key={result.recipeId}
                  className={`p-4 rounded-lg border ${
                    result.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xl ${result.success ? '✅' : '❌'}`}>
                          {result.success ? '✅' : '❌'}
                        </span>
                        <span className="font-medium text-gray-900">{result.title}</span>
                        <span className="text-sm text-gray-500">(ID: {result.recipeId})</span>
                      </div>
                      {result.error && (
                        <p className="text-sm text-red-600 mt-1">{result.error}</p>
                      )}
                    </div>
                    {result.imageUrl && (
                      <img
                        src={result.imageUrl}
                        alt={result.title}
                        className="w-32 h-24 object-cover rounded-lg"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            Generar Más Imágenes
          </button>
        </div>
      )}
    </div>
  );
}
