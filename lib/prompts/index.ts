import { argentinaPrompts } from './argentina';
import { mexicoPrompts } from './mexico';
import { spainPrompts } from './spain';
import { italyPrompts } from './italy';
import { chinaPrompts } from './china';
import { japanPrompts } from './japan';
import { peruPrompts } from './peru';
import { usaPrompts } from './usa';

export type Country = 'argentina' | 'mexico' | 'spain' | 'italy' | 'china' | 'japan' | 'peru' | 'usa';

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
};

export const getPrompt = (
  country: Country,
  ingredients?: string[]
): string => {
  const prompts = countryPrompts[country];
  if (!prompts) {
    throw new Error(`No prompts found for country: ${country}`);
  }
  
  return ingredients && ingredients.length > 0
    ? prompts.withIngredients(ingredients)
    : prompts.random();
};
