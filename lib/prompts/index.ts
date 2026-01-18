import { argentinaPrompts } from './argentina';
import { mexicoPrompts } from './mexico';
import { spainPrompts } from './spain';
import { italyPrompts } from './italy';
import { chinaPrompts } from './china';
import { japanPrompts } from './japan';
import { peruPrompts } from './peru';
import { usaPrompts } from './usa';
import { medioOrientePrompts } from './medio-oriente';

export type Country = 'argentina' | 'mexico' | 'spain' | 'italy' | 'china' | 'japan' | 'peru' | 'usa' | 'medio-oriente';

export interface CountryPrompts {
  withIngredients: (ingredients: string[]) => string;
  random: () => string;
}

export const countryPrompts: Record<Country, CountryPrompts> = {
  argentina: argentinaPrompts,
  mexico: mexicoPrompts,
  spain: spainPrompts,
  italy: italyPrompts,
  china: chinaPrompts,
  japan: japanPrompts,
  peru: peruPrompts,
  usa: usaPrompts,
  'medio-oriente': medioOrientePrompts,
};

export const getPrompt = (
  country: Country,
  ingredients?: string[],
  existingTitles?: string[]
): string => {
  const prompts = countryPrompts[country];
  if (!prompts) {
    throw new Error(`No prompts found for country: ${country}`);
  }
  
  let basePrompt = ingredients && ingredients.length > 0
    ? prompts.withIngredients(ingredients)
    : prompts.random();
  
  // Add existing titles to avoid duplicates
  if (existingTitles && existingTitles.length > 0) {
    const recentTitles = existingTitles.slice(-100); // Last 100 recipes
    const titlesWarning = `\n\nIMPORTANTE: EVITA generar recetas con títulos similares a estos que ya existen:\n${recentTitles.join(', ')}\n\nGenera un plato DIFERENTE y ORIGINAL.`;
    basePrompt += titlesWarning;
  }
  
  return basePrompt;
};
