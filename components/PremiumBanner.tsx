import SubscriptionForm from './SubscriptionForm';

export default function PremiumBanner() {
  return (
    <div className="bg-gradient-to-r from-terracota to-madera rounded-lg shadow-xl p-6 md:p-8 text-white">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">
          🚀 Próximamente: Tu Alacena Inteligente
        </h2>
        <p className="text-white/90 mb-6 text-lg">
          Planifica tu semana con LACENA. Recibe recetas personalizadas basadas en tu despensa y preferencias. Ahorra tiempo y dinero.
        </p>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Unete a la Lista de Espera</h3>
          <p className="text-white/90 mb-4">
            Sé el primero en descubrir el planificador semanal inteligente de LACENA.
          </p>
          <SubscriptionForm />
        </div>
      </div>
    </div>
  );
}
