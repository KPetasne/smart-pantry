export const peruPrompts = {
  withIngredients: (ingredients: string[]) => `Eres un chef experto en cocina peruana. Genera una receta REAL peruana usando: ${ingredients.join(', ')}.

Platos peruanos: Ceviche, Lomo saltado, Ají de gallina, Causa limeña, Anticuchos, Arroz con pollo

Usa: ají amarillo, ají panca, culantro, limón

Devuelve SOLO JSON:
{
  "title": "Nombre",
  "description": "Descripción breve del plato (1-2 líneas)",
  "prepTime": 15,
  "cookTime": 30,
  "ingredients": ["500g pescado", ...],
  "instructions": [...],
  "difficulty": "easy" | "medium" | "hard",
  "servings": 4
}`,
  random: () => `Genera una receta peruana tradicional.

Platos: Ceviche, Lomo saltado, Ají de gallina, Causa limeña, Anticuchos, Papa a la huancaína, Pollo a la brasa

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
