# Backoffice - Smart Pantry

Panel de administración protegido con autenticación para gestionar recetas y ejecutar scripts de mantenimiento.

## Características

### Autenticación
- Login con usuario y contraseña
- Rate limiting: máximo 5 intentos cada 15 minutos por IP
- Sesiones con NextAuth.js v5
- Protección de rutas con middleware

### Gestión de Recetas
- **Listar**: Vista paginada de todas las recetas con filtros
- **Crear**: Formulario para agregar nuevas recetas
- **Editar**: Actualizar recetas existentes
- **Eliminar**: Borrar recetas con confirmación

### Ejecución de Scripts
- **Seed**: Genera nuevas recetas usando Gemini API
- **Cleanup**: Elimina recetas duplicadas
- **Logs en tiempo real**: Console interactiva muestra el progreso de cada script

### Dashboard
- Estadísticas de recetas (total, por dificultad, por país)
- Acceso rápido a funciones principales

## Configuración Inicial

### 1. Variables de Entorno

Asegúrate de tener estas variables en tu archivo `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/smart_pantry
GEMINI_API_KEY=your_gemini_api_key
AUTH_SECRET=your_secret_key_here  # Genera uno con: openssl rand -base64 32
```

### 2. Crear la tabla de admin_users

La tabla ya está definida en `lib/schema.sql`. Si no se creó automáticamente, ejecuta:

```bash
psql $DATABASE_URL -c "CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);"
```

### 3. Crear el primer usuario admin

```bash
npm run init-admin
```

Este comando te pedirá:
- Nombre de usuario (mínimo 3 caracteres)
- Contraseña (mínimo 6 caracteres)
- Confirmación de contraseña

## Uso

### Acceso al Backoffice

1. Inicia el servidor de desarrollo:
```bash
npm run dev
```

2. Navega a: `http://localhost:3000/admin/login`

3. Ingresa tus credenciales

### Gestión de Recetas

#### Crear Nueva Receta

1. Ve a `/admin/recipes` o haz clic en "Nueva Receta" desde el dashboard
2. Completa el formulario:
   - **Título**: Nombre de la receta
   - **Ingredientes**: Uno por línea
   - **Instrucciones**: Una por línea
   - **Dificultad**: easy, medium, o hard
   - **País**: argentina, mexico, spain, italy, china, japan, peru, usa
   - **Idioma**: es (español) o en (inglés)
3. Haz clic en "Crear Receta"

#### Editar Receta

1. Ve a `/admin/recipes`
2. Haz clic en "Editar" en la receta que deseas modificar
3. Actualiza los campos necesarios
4. Haz clic en "Guardar Cambios"

#### Eliminar Receta

1. Ve a `/admin/recipes`
2. Haz clic en "Eliminar" en la receta que deseas borrar
3. Confirma la eliminación

### Ejecutar Scripts

#### Seed (Generar Recetas)

1. Ve al dashboard `/admin`
2. Haz clic en "Ejecutar Seed"
3. El modal mostrará logs en tiempo real del progreso
4. Por defecto genera 20 recetas (configurable en el código)

#### Cleanup (Eliminar Duplicados)

1. Ve al dashboard `/admin`
2. Haz clic en "Ejecutar Cleanup"
3. El modal mostrará los duplicados encontrados y eliminados
4. Mantiene la versión más reciente de cada receta duplicada

## Estructura de Archivos

```
app/
├── admin/
│   ├── layout.tsx              # Layout con navbar y logout
│   ├── page.tsx                # Dashboard principal
│   ├── login/
│   │   └── page.tsx            # Página de login
│   └── recipes/
│       ├── page.tsx            # Lista de recetas
│       ├── new/
│       │   └── page.tsx        # Crear receta
│       └── [id]/
│           └── edit/
│               └── page.tsx    # Editar receta
├── api/
│   ├── auth/
│   │   └── [...nextauth]/
│   │       └── route.ts        # NextAuth endpoints
│   └── admin/
│       ├── recipes/
│       │   ├── route.ts        # GET list + POST create
│       │   └── [id]/
│       │       └── route.ts    # GET + PUT + DELETE
│       ├── scripts/
│       │   └── route.ts        # POST execute + GET status
│       └── stats/
│           └── route.ts        # GET dashboard stats

lib/
├── rate-limiter.ts             # Rate limiting en memoria
└── schema.sql                  # Schema actualizado con admin_users

scripts/
├── init-admin.ts               # Script de creación de usuario
├── seed.ts                     # Refactorizado con logging
└── cleanup-duplicates.ts       # Refactorizado con logging

auth.config.ts                  # Configuración de NextAuth
auth.ts                         # Exportaciones de NextAuth
middleware.ts                   # Protección de rutas /admin/*
```

## Seguridad

### Rate Limiting
- Máximo 5 intentos de login por IP cada 15 minutos
- Almacenamiento en memoria (se resetea al reiniciar el servidor)
- Se limpia automáticamente cada hora

### Protección de Rutas
- Todas las rutas `/admin/*` requieren autenticación (excepto `/admin/login`)
- El middleware verifica la sesión en cada request
- Las API routes verifican la sesión con `await auth()`

### Contraseñas
- Hasheadas con bcrypt (12 rounds)
- No se almacenan en texto plano
- Validación mínima de 6 caracteres

## Troubleshooting

### "Unauthorized" en API routes

Asegúrate de que:
1. Estás logueado en `/admin/login`
2. La variable `AUTH_SECRET` está configurada en `.env`
3. Las cookies están habilitadas en tu navegador

### Scripts no se ejecutan

Verifica que:
1. `GEMINI_API_KEY` está configurada correctamente
2. La base de datos está accesible
3. Tienes permisos de escritura en la base de datos

### No puedo crear usuario admin

Comprueba que:
1. La tabla `admin_users` existe en la base de datos
2. El `DATABASE_URL` es correcto
3. No existe ya un usuario con ese nombre

## API Reference

### POST `/api/admin/recipes`
Crea una nueva receta.

**Body:**
```json
{
  "title": "string",
  "ingredients": ["string"],
  "instructions": ["string"],
  "difficulty": "easy" | "medium" | "hard",
  "language": "es" | "en",
  "country": "argentina" | "mexico" | ...
}
```

### GET `/api/admin/recipes?page=1&limit=20`
Lista recetas con paginación.

### PUT `/api/admin/recipes/[id]`
Actualiza una receta existente.

### DELETE `/api/admin/recipes/[id]`
Elimina una receta.

### POST `/api/admin/scripts`
Ejecuta un script.

**Body:**
```json
{
  "action": "seed" | "cleanup",
  "params": {
    "count": 20  // opcional, solo para seed
  }
}
```

### GET `/api/admin/scripts?executionId=xxx`
Obtiene el estado y logs de una ejecución.

### GET `/api/admin/stats`
Obtiene estadísticas del dashboard.
