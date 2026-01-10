export const usaPrompts = {
  withIngredients: (ingredients: string[]) => `Eres un chef experto en cocina americana. Genera una receta REAL americana usando: ${ingredients.join(', ')}.

Platos americanos: Hamburguesas, BBQ ribs, Mac and cheese, Fried chicken, Apple pie, Brownies, Buffalo wings

Devuelve SOLO JSON:
{
  "title": "Nombre",
  "ingredients": ["500g carne", ...],
  "instructions": [...],
  "difficulty": "easy" | "medium" | "hard"
}`,

  random: () => `Genera una receta americana clásica.

Platos: Classic burger, BBQ ribs, Mac and cheese, Fried chicken, Apple pie, Brownies, Buffalo wings, Pulled pork, Meatloaf, Pancakes

Devuelve SOLO JSON:
{
  "title": "Nombre",
  "ingredients": [...],
  "instructions": [...],
  "difficulty": "easy" | "medium" | "hard"
}`,
};
