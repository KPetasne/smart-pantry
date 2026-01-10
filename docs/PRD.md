1 Product Requirements Document (PRD)

Proyecto: Smart Menu (Nombre clave) | Versión: 1.0 (MVP)

1.1 Visión del Producto
Resolver la "fatiga de decisión" diaria sobre la alimentación, ofreciendo inspiración inmediata basada en ingredientes disponibles y evolucionando hacia una planificación semanal automatizada que ahorre tiempo y dinero.

1.2 Problema y Público ObjetivoProblema: Los usuarios pierden entre 15-30 minutos diarios decidiendo qué comer, lo que lleva a decisiones poco saludables o gastos innecesarios en delivery.Audiencia: Profesionales ocupados, estudiantes y personas que buscan optimizar su despensa.

1.3 Requisitos Funcionales (MVP)
ID / Característica / Descripción
RF1 / Inspiración Diaria / Pantalla de inicio con 1 receta aleatoria y botón "Otra opción".
RF2 / Filtros Rápidos / Sugerencia de 3 platos filtrados por dieta (Carnívoro/Vegano) y dificultad.
RF3 / Búsqueda por Despensa / Entrada de 2-3 ingredientes para generar una receta específica.
RF4 / Smart Cache / Sistema que prioriza recetas existentes antes de consultar la IA.
RF5 / Lead Magnet (F5) / Banner y formulario de suscripción para el futuro "Planificador Semanal".

1.4 Requisitos No Funcionales
Rápidez: Las consultas a la DB deben responder en <200ms.
Costo: El 90% del tráfico gratuito debe ser servido sin costo de API (via Cache).
UX: Diseño simple, "Mobile First" y sin registro obligatorio para funciones gratis.