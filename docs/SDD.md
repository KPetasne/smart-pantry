2 Software Design Document (SDD)
Arquitectura: Monolito Escalable / Cloud Native

2.1 Arquitectura de Sistema
Fragmento de código

graph TD
    A[Cliente Web - React/Next.js] --> B[API Gateway/Express Server]
    B --> C{Cache Check - PostgreSQL}
    C -- Existe --> D[Retornar Receta]
    C -- No Existe --> E[Gemini API Service]
    E --> F[Guardar en DB - Transacción]
    F --> D

2.2 Modelo de Datos (PostgreSQL)
recipes: Almacena el contenido (ID, Título, Instrucciones JSON, Dificultad).
ingredients: Catálogo único de ingredientes normalizados.
recipe_ingredients: Relación Muchos-a-Muchos para búsquedas indexadas.
search_leads: Almacena correos de la lista de espera (Feature 5).

2.3 Especificación de API (Endpoints Principales)
GET /api/recipes/random: Obtiene una receta aleatoria de la DB.

POST /api/recipes/search:
Body: { "ingredients": ["pollo", "limon"] }
Lógica: Ejecuta la lógica "Smart Cache".

POST /api/leads/subscribe:
Body: { "email": "user@example.com" }

2.4 Lógica del "Smart Cache" (Algoritmo)
1- Recibir array de ingredientes.
2- Normalizar strings (trim, lowercase).
3- Query SQL con INTERSECT o GROUP BY / HAVING COUNT para encontrar recetas que cubran el 100% de los ingredientes ingresados.
4- Si el resultado es nulo:
Llamar a GeminiService.
Sanitizar JSON.
Insertar en DB usando DB Transaction para asegurar que la receta y sus relaciones se creen correctamente.