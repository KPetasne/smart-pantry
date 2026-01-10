# Smart Pantry

Aplicación web para encontrar recetas basadas en ingredientes disponibles, resolviendo la "fatiga de decisión" diaria sobre la alimentación.

## Características

- **Inspiración Diaria**: Receta aleatoria en la página principal con opción de obtener otra
- **Búsqueda por Ingredientes**: Busca recetas usando 2-3 ingredientes disponibles
- **Filtros Rápidos**: Filtra recetas por dieta (Carnívoro/Vegano) y dificultad
- **Smart Cache**: Sistema que prioriza recetas existentes antes de consultar la IA
- **Lead Magnet**: Banner y formulario de suscripción para el futuro "Planificador Semanal"
- **Analytics**: Tracking de búsquedas para medir ingredientes más populares

## Stack Tecnológico

- **Frontend**: Next.js 14 con TypeScript, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de Datos**: PostgreSQL (compatible con Vercel Postgres)
- **IA**: Google Gemini API para generación de recetas
- **Validación**: Zod
- **Despliegue**: Vercel

## Requisitos Previos

- Node.js 18+ 
- PostgreSQL (local o Vercel Postgres)
- API Key de Google Gemini

## Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/smart_pantry
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Configurar la base de datos

El schema se creará automáticamente cuando ejecutes el script de seeding. Asegúrate de que tu base de datos PostgreSQL esté corriendo y accesible.

### 4. Poblar la base de datos con recetas iniciales

```bash
npm run seed
```

Este comando generará 200 recetas usando Gemini API y las insertará en la base de datos.

## Desarrollo

### Ejecutar en modo desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Construir para producción

```bash
npm run build
npm start
```

## Estructura del Proyecto

```
smart-pantry/
├── app/
│   ├── api/              # API Routes
│   │   ├── recipes/      # Endpoints de recetas
│   │   ├── leads/        # Endpoint de suscripciones
│   │   └── analytics/    # Endpoint de analytics
│   ├── recipes/[id]/     # Página de detalle de receta
│   ├── search/           # Página de búsqueda
│   ├── filters/          # Página de filtros
│   └── page.tsx          # Landing page
├── components/           # Componentes React
├── lib/                 # Utilidades y servicios
│   ├── db.ts            # Conexión a base de datos
│   ├── gemini-service.ts # Servicio de Gemini
│   ├── recipe-normalizer.ts # Normalización de datos
│   └── analytics.ts     # Servicio de analytics
└── scripts/
    └── seed.ts          # Script de seeding
```

## API Endpoints

### GET `/api/recipes/random`
Obtiene una receta aleatoria de la base de datos.

**Response:**
```json
{
  "id": 1,
  "title": "Pasta con Pollo",
  "ingredients": ["pasta", "pollo", "tomate"],
  "instructions": ["Paso 1", "Paso 2"],
  "difficulty": "easy",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

### POST `/api/recipes/search`
Busca una receta por ingredientes. Implementa Smart Cache.

**Request:**
```json
{
  "ingredients": ["pollo", "limon"]
}
```

**Response:**
```json
{
  "id": 1,
  "title": "Pollo al Limón",
  "ingredients": ["pollo", "limon", "ajo"],
  "instructions": ["Paso 1", "Paso 2"],
  "difficulty": "medium",
  "created_at": "2024-01-01T00:00:00.000Z",
  "fromCache": true
}
```

### POST `/api/recipes/filter`
Filtra recetas por dieta y/o dificultad.

**Request:**
```json
{
  "diet": "vegan",
  "difficulty": "easy",
  "limit": 3
}
```

### POST `/api/leads/subscribe`
Suscribe un email a la lista de espera.

**Request:**
```json
{
  "email": "user@example.com"
}
```

### POST `/api/analytics/track`
Registra una búsqueda para analytics.

**Request:**
```json
{
  "ingredients": ["pollo", "limon"]
}
```

## Lógica del Smart Cache

1. Recibe array de ingredientes
2. Normaliza strings (trim, lowercase)
3. Busca en la base de datos recetas que contengan TODOS los ingredientes
4. Si encuentra una receta, la retorna (desde cache)
5. Si no encuentra, llama a Gemini API para generar una nueva receta
6. Guarda la nueva receta en la base de datos
7. Retorna la nueva receta

## Despliegue en Vercel

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en Vercel:
   - `DATABASE_URL`: URL de tu base de datos PostgreSQL (puedes usar Vercel Postgres)
   - `GEMINI_API_KEY`: Tu API key de Gemini
3. Vercel detectará automáticamente Next.js y desplegará la aplicación

## Requisitos No Funcionales

- **Rápidez**: Consultas a DB < 200ms
- **Costo**: 90% del tráfico gratuito servido sin costo de API (via Cache)
- **UX**: Diseño mobile-first, sin registro obligatorio para funciones gratis

## Licencia

MIT
