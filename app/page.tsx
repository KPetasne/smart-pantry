import RandomRecipe from '@/components/RandomRecipe';
import PremiumBanner from '@/components/PremiumBanner';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-4">
            ¿Qué como?
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-2">
            La inspiración que necesitas para tu próxima comida
          </p>
          <p className="text-md text-gray-500">
            ¿No sabes qué cocinar hoy? Déjate inspirar
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            ✨ Tu Receta de Inspiración
          </h2>
          <RandomRecipe />
        </div>

        <div className="max-w-2xl mx-auto mb-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              ¿Prefieres buscar por ingredientes o filtros?
            </h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/search"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-center"
            >
              🔍 Buscar por Ingredientes
            </Link>
            <Link
              href="/filters"
              className="px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold text-center"
            >
              ⚡ Filtros Rápidos
            </Link>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <PremiumBanner />
        </div>
      </div>
    </main>
  );
}
