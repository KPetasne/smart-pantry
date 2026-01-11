export const mexicoPrompts = {
  withIngredients: (ingredients: string[]) => `Eres un chef experto en cocina mexicana. Genera una receta REAL mexicana usando: ${ingredients.join(', ')}.

Usa vocabulario mexicano: jitomate, elote, frijoles, chile, aguacate
Ejemplos: Tacos, Enchiladas, Pozole, Mole, Tamales

Devuelve SOLO JSON:
{
  "title": "Nombre del plato",
  "ingredients": ["ingrediente1", ...],
  "instructions": ["paso1", ...],
  "difficulty": "easy" | "medium" | "hard",
  "servings": 4
}`,

  random: () => `Genera una receta mexicana auténtica.

Platos: Tacos al pastor, Enchiladas verdes, Pozole, Mole, Chilaquiles, Tamales

Devuelve SOLO JSON:
{
  "title": "Nombre del plato",
  "ingredients": ["ingrediente1", ...],
  "instructions": ["paso1", ...],
  "difficulty": "easy" | "medium" | "hard",
  "servings": 4
}`,
};
