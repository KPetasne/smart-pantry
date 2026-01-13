import RandomRecipe from '@/components/RandomRecipe';
import PremiumBanner from '@/components/PremiumBanner';
import Header from '@/components/Header';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-blancoCrema to-white">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-carbon mb-4">
              Tu próxima cena empieza aquí
            </h1>
            <p className="text-md text-gray-500">
              Ideas que salen de tu alacena
            </p>
          </div>

          <div id="inspiracion" className="max-w-2xl mx-auto mb-12 scroll-mt-20">
            <h2 className="text-3xl font-bold text-carbon mb-6 text-center">
              ✨ Inspiración Instantánea
            </h2>
            <p className="text-center text-salvia mb-4">
              Un golpe de ideas para tu mesa
            </p>
            <RandomRecipe />
          </div>

          <div id="buscador" className="max-w-2xl mx-auto mb-8 scroll-mt-20">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Encuentra tu próxima receta
              </h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/search"
                className="px-6 py-3 bg-terracota text-white rounded-lg hover:bg-terracota/90 transition-colors font-semibold text-center"
              >
                🔍 Buscá en tu alacena
              </Link>
              <Link
                href="/filters"
                className="px-6 py-3 bg-blancoCrema border-2 border-terracota text-terracota rounded-lg hover:bg-terracota/10 transition-colors font-semibold text-center"
              >
                ⚡ Filtros Rápidos
              </Link>
            </div>
          </div>

          <div id="planificador" className="max-w-2xl mx-auto scroll-mt-20">
            <PremiumBanner />
          </div>
        </div>
      </main>
    </>
  );
}
