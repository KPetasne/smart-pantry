'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-salvia/30 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-carbon hover:text-terracota transition-colors">
            LACENA
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => scrollToSection('inspiracion')}
              className="text-carbon hover:text-terracota transition-colors font-medium"
            >
              Inspiración
            </button>
            <button
              onClick={() => scrollToSection('buscador')}
              className="text-carbon hover:text-terracota transition-colors font-medium"
            >
              Buscador
            </button>
            <button
              onClick={() => scrollToSection('planificador')}
              className="text-carbon hover:text-terracota transition-colors font-medium"
            >
              Planificador
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-carbon hover:text-terracota transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-salvia/30">
            <div className="flex flex-col gap-3">
              <button
                onClick={() => scrollToSection('inspiracion')}
                className="text-left px-4 py-2 text-carbon hover:bg-blancoCrema rounded-lg transition-colors font-medium"
              >
                Inspiración
              </button>
              <button
                onClick={() => scrollToSection('buscador')}
                className="text-left px-4 py-2 text-carbon hover:bg-blancoCrema rounded-lg transition-colors font-medium"
              >
                Buscador
              </button>
              <button
                onClick={() => scrollToSection('planificador')}
                className="text-left px-4 py-2 text-carbon hover:bg-blancoCrema rounded-lg transition-colors font-medium"
              >
                Planificador
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
