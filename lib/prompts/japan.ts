export const japanPrompts = {
  withIngredients: (ingredients: string[]) => `Eres un chef experto en cocina japonesa. Genera una receta REAL japonesa usando: ${ingredients.join(', ')}.

Platos japoneses: Ramen, Sushi rolls, Teriyaki chicken, Gyoza, Tempura, Okonomiyaki, Yakisoba

Usa: miso, salsa de soja, mirin, sake, dashi

Devuelve SOLO JSON:
{
  "title": "Nombre",
  "description": "Descripción breve del plato (1-2 líneas)",
  "prepTime": 15,
  "cookTime": 30,
  "ingredients": ["200g fideos", ...],
  "instructions": [...],
  "difficulty": "easy" | "medium" | "hard",
  "servings": 4
}`,
  random: () => `Genera una receta japonesa tradicional.

Platos: Ramen, Sushi, Pollo teriyaki, Gyoza, Tempura, Okonomiyaki, Yakisoba, Katsudon, Udon, Tonkatsu

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
