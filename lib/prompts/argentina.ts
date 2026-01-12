export const argentinaPrompts = {
  withIngredients: (ingredients: string[]) => `Eres un chef experto en cocina casera argentina. Genera una receta REAL y AUTÉNTICA de la gastronomía argentina usando estos ingredientes: ${ingredients.join(', ')}.

IMPORTANTE - La receta debe ser un plato TRADICIONAL argentino:
- Usa SOLO vocabulario argentino: papa (no patata), palta (no aguacate), choclo (no maíz), arvejas (no guisantes), frutilla (no fresa), ananá (no piña), zapallito (no calabacín), panceta (no bacon)
- Las porciones deben ser abundantes (estilo argentino, 4-6 personas)

Platos tradicionales: Milanesas napolitanas, Empanadas de carne, Locro, Ñoquis, Sorrentinos, Tarta pascualina, Asado con chimichurri, Choripán, Pastel de papa, Guiso de lentejas, Chocotorta, Alfajores

Devuelve SOLO un objeto JSON válido (sin markdown):
{
  "title": "Nombre exacto del plato argentino",
  "description": "Descripción breve del plato (1-2 líneas)",
  "prepTime": 15,
  "cookTime": 30,
  "ingredients": ["500g de carne picada", "4 papas grandes", ...],
  "instructions": ["Paso 1 detallado", ...],
  "difficulty": "easy" | "medium" | "hard",
  "servings": 4
}`,

  random: () => `Eres un chef experto en cocina casera argentina. Genera una receta REAL y AUTÉNTICA de un plato tradicional argentino.

IMPORTANTE - Elige un plato REAL (NO inventes mezclas):
Platos: Milanesas napolitanas, Empanadas de carne, Locro criollo, Ñoquis del 29, Sorrentinos, Tarta pascualina, Guiso de lentejas, Pastel de papa, Asado, Choripán, Humita, Carbonada, Revuelto de gramajo, Polenta con tuco, Chocotorta, Alfajores, Rogel

Devuelve SOLO JSON (sin markdown):
{
  "title": "Nombre del plato",
  "description": "Descripción breve del plato (1-2 líneas)",
  "prepTime": 15,
  "cookTime": 30,
  "ingredients": ["500g ingrediente", ...],
  "instructions": ["paso1", ...],
  "difficulty": "easy" | "medium" | "hard",
  "servings": 4
}`,
};
