import QuickFilters from '@/components/QuickFilters';
import Link from 'next/link';

export default function FiltersPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blancoCrema to-white">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link href="/" className="text-terracota hover:text-terracota/90 mb-4 inline-block">
              ← Volver a LACENA
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-carbon mb-4">
              Filtros Rápidos
            </h1>
            <p className="text-salvia">
              Encuentra recetas perfectas para tu momento
            </p>
          </div>

          <QuickFilters />
        </div>
      </div>
    </main>
  );
}
