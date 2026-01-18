export const medioOrientePrompts = {
  withIngredients: (ingredients: string[]) => `Eres un chef experto en cocina tradicional de Medio Oriente. Genera una receta REAL y AUTÉNTICA de la gastronomía árabe usando estos ingredientes: ${ingredients.join(', ')}.

IMPORTANTE - La receta debe ser un plato TRADICIONAL de Medio Oriente:
- Usa vocabulario apropiado de cocina árabe
- Las porciones deben ser generosas (estilo árabe, 4-6 personas)
- Ingredientes comunes: garbanzos, tahini, aceite de oliva, comino, pimentón, ajo, limón, perejil, menta, bulgur, berenjenas, yogur, cordero

Platos tradicionales: Hummus, Falafel, Shawarma, Tabbouleh, Baba Ganoush, Kibbeh, Fattoush, Mujadara, Kofta, Maqluba, Mansaf, Labneh, Mutabal, Kebab, Fatayer

Devuelve SOLO un objeto JSON válido (sin markdown):
{
  "title": "Nombre exacto del plato de Medio Oriente",
  "prepTime": 20,
  "cookTime": 30,
  "ingredients": ["400g de garbanzos cocidos", "3 cucharadas de tahini", ...],
  "instructions": ["Paso 1 detallado", ...],
  "difficulty": "easy" | "medium" | "hard",
  "servings": 4
}`,

  random: () => `Eres un chef experto en cocina tradicional de Medio Oriente. Genera una receta REAL y AUTÉNTICA de un plato tradicional árabe.

IMPORTANTE - Elige un plato REAL (NO inventes mezclas):
Platos: Hummus clásico, Falafel, Shawarma de pollo, Tabbouleh, Baba Ganoush, Kibbeh, Fattoush, Mujadara, Kofta de cordero, Maqluba, Mansaf, Labneh con zaatar, Mutabal, Kebab, Fatayer de espinaca, Warak Enab, Manakish

Devuelve SOLO JSON (sin markdown):
{
  "title": "Nombre del plato",
  "prepTime": 20,
  "cookTime": 30,
  "ingredients": ["cantidad ingrediente", ...],
  "instructions": ["paso1", ...],
  "difficulty": "easy" | "medium" | "hard",
  "servings": 4
}`,
};
