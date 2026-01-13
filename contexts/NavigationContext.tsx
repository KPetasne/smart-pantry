'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface NavigationContextType {
  navigationStack: string[];
  popNavigation: () => string | null;
}

const NavigationContext = createContext<NavigationContextType>({
  navigationStack: [],
  popNavigation: () => null,
});

const VALID_PATHS = ['/', '/search', '/filters'];
const STORAGE_KEY = 'navigationStack';

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [navigationStack, setNavigationStack] = useState<string[]>([]);
  const pathname = usePathname();

  // Initialize from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setNavigationStack(parsed);
          }
        } catch (e) {
          // Invalid JSON, ignore
        }
      }
    }
  }, []);

  // Track navigation changes - add to stack when visiting valid paths
  useEffect(() => {
    if (VALID_PATHS.includes(pathname)) {
      setNavigationStack((prev) => {
        // Don't add if it's already the last item in stack
        if (prev[prev.length - 1] === pathname) {
          return prev;
        }
        const newStack = [...prev, pathname];
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newStack));
        }
        return newStack;
      });
    }
  }, [pathname]);

  // Pop from stack when navigating back
  const popNavigation = (): string | null => {
    let targetPath: string | null = null;
    
    setNavigationStack((prev) => {
      if (prev.length === 0) {
        // No history, go to home
        targetPath = '/';
        return [];
      }
      
      if (prev.length === 1) {
        // Only one item in history (probably home), stay there or go to home
        targetPath = prev[0] === '/' ? '/' : '/';
        return [];
      }
      
      // Remove the last item (where we came from) and go to it
      const newStack = prev.slice(0, -1);
      targetPath = prev[prev.length - 1]; // The page we're removing is where we go back to
      
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newStack));
      }
      return newStack;
    });
    
    return targetPath;
  };

  return (
    <NavigationContext.Provider value={{ navigationStack, popNavigation }}>
      {children}
    </NavigationContext.Provider>
  );
}

export const useNavigation = () => useContext(NavigationContext);
