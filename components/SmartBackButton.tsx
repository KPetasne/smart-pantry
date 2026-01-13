'use client';

import { useRouter } from 'next/navigation';
import { useNavigation } from '@/contexts/NavigationContext';

export default function SmartBackButton() {
  const router = useRouter();
  const { popNavigation } = useNavigation();

  const handleBack = () => {
    const targetPath = popNavigation();
    if (targetPath) {
      router.push(targetPath);
    } else {
      router.push('/');
    }
  };

  return (
    <button
      onClick={handleBack}
      className="text-terracota hover:text-terracota/90 mb-4 inline-flex items-center transition-colors"
    >
      ← Volver a LACENA
    </button>
  );
}
