import QuickFilters from '@/components/QuickFilters';
import Link from 'next/link';

export default function FiltersPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link href="/" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
              ← Volver al inicio
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Filtros Rápidos
            </h1>
            <p className="text-gray-600">
              Encuentra recetas filtradas por dieta y dificultad
            </p>
          </div>

          <QuickFilters />
        </div>
      </div>
    </main>
  );
}
