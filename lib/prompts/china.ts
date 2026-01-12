export const chinaPrompts = {
  withIngredients: (ingredients: string[]) => `Eres un chef experto en cocina china. Genera una receta REAL china usando: ${ingredients.join(', ')}.

Platos chinos: Chow mein, Kung pao chicken, Arroz frito, Cerdo agridulce, Dumplings, Mapo tofu

Usa: salsa de soja, jengibre, ajo, aceite de sésamo

Devuelve SOLO JSON:
{
  "title": "Nombre",
  "description": "Descripción breve del plato (1-2 líneas)",
  "prepTime": 15,
  "cookTime": 30,
  "ingredients": ["300g pollo", ...],
  "instructions": [...],
  "difficulty": "easy" | "medium" | "hard",
  "servings": 4
}`,
  random: () => `Genera una receta china tradicional.

Platos: Chow mein, Kung pao chicken, Arroz frito, Dumplings, Mapo tofu, Spring rolls

Devuelve SOLO JSON:
{
  "title": "Nombre",
  "description": "Descripción breve del plato (1-2 líneas)",
  "prepTime": 15,
  "cookTime": 30,
  "ingredients": [...],
  "instructions": [...],
  "difficulty": "easy" | "medium" | "hard",
  "servings": 4
}`,
};
