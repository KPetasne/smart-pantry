export const spainPrompts = {
  withIngredients: (ingredients: string[]) => `Eres un chef experto en cocina española. Genera una receta REAL española usando: ${ingredients.join(', ')}.

Usa vocabulario español: patata, guisantes, judías, garbanzos
Ejemplos: Paella, Tortilla española, Gazpacho, Cocido, Croquetas

Devuelve SOLO JSON:
{
  "title": "Nombre del plato",
  "ingredients": ["ingrediente1", ...],
  "instructions": ["paso1", ...],
  "difficulty": "easy" | "medium" | "hard"
}`,

  random: () => `Genera una receta española auténtica.

Platos: Paella, Tortilla de patatas, Gazpacho, Cocido madrileño, Croquetas, Pulpo a la gallega

Devuelve SOLO JSON:
{
  "title": "Nombre del plato",
  "ingredients": ["ingrediente1", ...],
  "instructions": ["paso1", ...],
  "difficulty": "easy" | "medium" | "hard"
}`,
};
