'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ClockIcon } from '@heroicons/react/24/solid';
import { useDebounce } from '@/lib/useDebounce';
import DifficultyBadge from './DifficultyBadge';

interface RecipeSuggestion {
  id: number;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prep_time: number | null;
  cook_time: number | null;
  image_url: string | null;
}

export default function RecipeAutocomplete() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const debouncedQuery = useDebounce(query, 300);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length < 3) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/recipes/autocomplete?q=${encodeURIComponent(debouncedQuery)}&limit=10`
        );
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
          setIsOpen(true);
          setSelectedIndex(-1);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          navigateToRecipe(suggestions[selectedIndex].id);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const navigateToRecipe = (id: number) => {
    setIsOpen(false);
    setQuery('');
    setSuggestions([]);
    router.push(`/recipes/${id}`);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const getTotalTime = (recipe: RecipeSuggestion) => {
    const total = (recipe.prep_time || 0) + (recipe.cook_time || 0);
    return total > 0 ? `${total} min` : null;
  };

  return (
    <div className="relative w-full">
      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.length >= 3 && suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder="Busca tu receta favorita..."
          className="w-full px-4 py-3 pl-12 pr-12 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-terracota focus:ring-2 focus:ring-terracota/20 transition-colors"
        />
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Dropdown - Fullscreen on mobile, regular on desktop */}
      {isOpen && query.length >= 3 && (
        <>
          {/* Mobile backdrop */}
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsOpen(false)} />
          
          {/* Dropdown container */}
          <div
            ref={dropdownRef}
            className="fixed inset-x-0 top-0 bottom-0 z-50 bg-blancoCrema overflow-y-auto md:absolute md:top-full md:mt-2 md:inset-x-auto md:bottom-auto md:w-full md:max-h-96 md:rounded-lg md:shadow-xl md:border md:border-gray-200"
          >
            {/* Mobile header */}
            <div className="sticky top-0 bg-blancoCrema border-b border-gray-200 p-4 flex items-center justify-between md:hidden z-10">
              <h3 className="text-lg font-semibold text-carbon">Resultados</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Cerrar"
              >
                <XMarkIcon className="w-6 h-6 text-carbon" />
              </button>
            </div>

            {/* Results */}
            <div className="p-2 md:p-1">
              {isLoading ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  Buscando...
                </div>
              ) : suggestions.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  No se encontraron recetas
                </div>
              ) : (
                <ul className="space-y-1">
                  {suggestions.map((recipe, index) => {
                    const totalTime = getTotalTime(recipe);
                    return (
                      <li key={recipe.id}>
                        <button
                          onClick={() => navigateToRecipe(recipe.id)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            index === selectedIndex
                              ? 'bg-terracota/10 border border-terracota/30'
                              : 'hover:bg-gray-100 border border-transparent'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Image */}
                            {recipe.image_url ? (
                              <img
                                src={recipe.image_url}
                                alt={recipe.title}
                                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-lg bg-gray-200 flex-shrink-0 flex items-center justify-center">
                                <MagnifyingGlassIcon className="w-6 h-6 text-gray-400" />
                              </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-carbon mb-1 line-clamp-2">
                                {recipe.title}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 text-sm">
                                <DifficultyBadge difficulty={recipe.difficulty} />
                                {totalTime && (
                                  <span className="inline-flex items-center gap-1 text-gray-600">
                                    <ClockIcon className="w-4 h-4" />
                                    {totalTime}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
