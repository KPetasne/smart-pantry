export const italyPrompts = {
  withIngredients: (ingredients: string[]) => `Eres un chef experto en cocina italiana auténtica. Genera una receta REAL italiana usando: ${ingredients.join(', ')}.

Platos italianos: Pasta carbonara, Risotto, Pizza margherita, Lasagna, Osso buco, Tiramisù, Parmigiana, Arancini

Devuelve SOLO JSON:
{
  "title": "Nombre del plato",
  "description": "Descripción breve del plato (1-2 líneas)",
  "prepTime": 15,
  "cookTime": 30,
  "ingredients": ["200g pasta", ...],
  "instructions": ["paso1", ...],
  "difficulty": "easy" | "medium" | "hard",
  "servings": 4
}`,
  random: () => `Genera una receta italiana AUTÉNTICA.

Platos: Spaghetti carbonara, Risotto ai funghi, Pizza napoletana, Lasagna, Osso buco, Tiramisù, Gnocchi al pesto, Cacio e pepe, Panna cotta

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
