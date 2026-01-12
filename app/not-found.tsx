import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-smoke to-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-carbon mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-600 mb-6">Página no encontrada</h2>
        <p className="text-gray-600 mb-8">La receta que buscas no existe.</p>
        <Link
          href="/"
          className="px-6 py-3 bg-terracota text-white rounded-lg hover:bg-terracota/90 transition-colors font-semibold inline-block"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
