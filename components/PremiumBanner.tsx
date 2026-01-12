import SubscriptionForm from './SubscriptionForm';

export default function PremiumBanner() {
  return (
    <div className="bg-gradient-to-r from-terracota to-mostaza rounded-lg shadow-xl p-6 md:p-8 text-white">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">
          🚀 Próximamente: Planificador Semanal
        </h2>
        <p className="text-smoke/90 mb-6 text-lg">
          Ahorra tiempo y dinero con nuestro planificador semanal automatizado. 
          Recibe recetas personalizadas basadas en tu despensa y preferencias.
        </p>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Únete a la Lista de Espera</h3>
          <p className="text-smoke/90 mb-4">
            Sé el primero en conocer cuando lancemos esta funcionalidad premium.
          </p>
          <SubscriptionForm />
        </div>
      </div>
    </div>
  );
}
