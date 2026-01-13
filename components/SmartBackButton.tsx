'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useNavigation } from '@/contexts/NavigationContext';

export default function SmartBackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { navigationStack, popNavigation } = useNavigation();

  const handleBack = () => {
    // Filter out current page from the stack to find where to go
    const stackWithoutCurrent = navigationStack.filter(path => path !== pathname);
    
    if (stackWithoutCurrent.length > 0) {
      // Go to the last page that's not the current page
      const targetPath = stackWithoutCurrent[stackWithoutCurrent.length - 1];
      popNavigation(); // Update the stack
      router.push(targetPath);
    } else {
      // No valid history, go home
      popNavigation();
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
