/**
 * Normalizes ingredient names for consistent storage and searching
 */
export function normalizeIngredient(ingredient: string): string {
  return ingredient
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\sñáéíóúüÑÁÉÍÓÚÜ.,;:!¡?¿()\[\]{}"'`\/\-]/g, '') // Remove unwanted special characters while preserving Spanish chars and common punctuation
    .trim();
}

/**
 * Normalizes an array of ingredients
 */
export function normalizeIngredients(ingredients: string[]): string[] {
  return ingredients
    .map(normalizeIngredient)
    .filter(ing => ing.length > 0) // Remove empty strings
    .filter((ing, index, self) => self.indexOf(ing) === index); // Remove duplicates
}

/**
 * Validates recipe data structure
 */
export interface RecipeData {
  title: string;
  ingredients: string[];
  instructions: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  servings?: number;
  language: string;
  country: string;
}

export function validateRecipeData(data: any): RecipeData {
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    throw new Error('Recipe title is required');
  }

  if (!Array.isArray(data.ingredients) || data.ingredients.length === 0) {
    throw new Error('Recipe must have at least one ingredient');
  }

  if (!Array.isArray(data.instructions) || data.instructions.length === 0) {
    throw new Error('Recipe must have at least one instruction');
  }

  const validDifficulties = ['easy', 'medium', 'hard'];
  if (!validDifficulties.includes(data.difficulty)) {
    throw new Error(`Difficulty must be one of: ${validDifficulties.join(', ')}`);
  }

  // Validate servings if present
  if (data.servings !== undefined && data.servings !== null) {
    const servingsNum = typeof data.servings === 'number' ? data.servings : parseInt(data.servings, 10);
    if (isNaN(servingsNum) || servingsNum < 1 || servingsNum > 12) {
      throw new Error('Servings must be a number between 1 and 12');
    }
  }

  return {
    title: data.title.trim(),
    ingredients: normalizeIngredients(data.ingredients),
    instructions: data.instructions.map((inst: string) => inst.trim()).filter((inst: string) => inst.length > 0),
    difficulty: data.difficulty,
    ...(data.servings !== undefined && data.servings !== null && { servings: typeof data.servings === 'number' ? data.servings : parseInt(data.servings, 10) }),
    language: data.language || 'es',
    country: data.country || 'argentina',
  };
}
