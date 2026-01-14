# 🔒 Guía de Implementación de Seguridad - Smart Pantry

## Resumen de Cambios

Esta implementación aborda las vulnerabilidades críticas identificadas en la auditoría de seguridad realizada el 13 de enero de 2026.

## ⚙️ Pre-requisitos

Antes de ejecutar los scripts de seguridad, asegúrate de tener configuradas las variables de entorno:

### **1. Crear archivo .env.local**

Si no existe, crea el archivo `.env.local` en la raíz del proyecto:

```bash
cp .env.example .env.local
```

### **2. Configurar DATABASE_URL**

Edita `.env.local` y agrega tu URL de PostgreSQL:

```env
DATABASE_URL=postgresql://username:password@host:port/database_name
```

**Ejemplo:**
```env
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/smart_pantry
```

### **3. Verificar conexión**

Puedes verificar que la base de datos está accesible intentando conectarte:

```bash
# Con psql
psql "postgresql://username:password@host:port/database_name"
```

Una vez configurado el `.env.local`, puedes proceder con los pasos de implementación.

## 🚨 Vulnerabilidades Críticas Resueltas

### 1. **Sistema RBAC (Role-Based Access Control)**
- ✅ Agregada columna `role` a tabla `admin_users` con valores: `admin` y `super_admin`
- ✅ Funciones helper de autorización: `requireAdmin()` y `requireSuperAdmin()`
- ✅ Todos los endpoints `/api/admin/*` ahora verifican roles apropiados

### 2. **Protección de Generación de IA**
- ✅ Rate limiting agresivo (1 request/minuto) en `/api/recipes/search`
- ✅ Protege contra consumo ilimitado de cuota de Gemini API
- ✅ Previene contaminación de base de datos

### 3. **Endpoints de Scripts Protegidos**
- ✅ `/api/admin/scripts` ahora requiere rol `super_admin`
- ✅ Previene ejecución no autorizada de scripts del sistema
- ✅ Audit logging de todas las ejecuciones

### 4. **Reseteo de Límites**
- ✅ `/api/admin/images/reset-monthly-limit` ahora requiere `super_admin`
- ✅ Previene bypass de controles de costos

### 5. **Sistema de Audit Logging**
- ✅ Tabla `audit_logs` para rastrear todas las acciones administrativas
- ✅ Registra: usuario, acción, recurso, IP, user agent, detalles
- ✅ Indexes optimizados para consultas rápidas

### 6. **Rate Limiting Global**
- ✅ Rate limiter mejorado con múltiples presets
- ✅ Aplicado a todos los endpoints públicos vulnerables
- ✅ Protección contra scraping y DoS

### 7. **Security Headers**
- ✅ CSP (Content Security Policy)
- ✅ HSTS (HTTP Strict Transport Security)
- ✅ X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- ✅ Referrer-Policy y Permissions-Policy
- ✅ Límites de tamaño de request/response

## 📋 Pasos de Implementación

### **Paso 1: Ejecutar Migración de Base de Datos**

```bash
# Agregar columna role a admin_users
npm run add-role-column
```

Esto creará:
- Columna `role` con constraint CHECK
- Promoverá el primer usuario a `super_admin`
- El resto tendrá rol `admin` por defecto

### **Paso 2: Inicializar Tabla de Audit Logs**

```bash
# Crear tabla audit_logs e índices
npm run init-audit-logs
```

O ejecutar ambos pasos a la vez:

```bash
# Setup completo de seguridad
npm run security-setup
```

### **Paso 3: Verificar Roles de Usuarios**

Conectarse a la base de datos y verificar:

```sql
SELECT id, username, role, created_at 
FROM admin_users 
ORDER BY created_at ASC;
```

**IMPORTANTE:** Asegurarse de que al menos un usuario tenga rol `super_admin` antes de desplegar.

### **Paso 4: Actualizar Variables de Entorno (Opcional)**

Si se desea usar una solución de rate limiting más robusta (recomendado para producción):

```env
# Para usar Redis en lugar de in-memory rate limiting
REDIS_URL=your_redis_url_here
```

### **Paso 5: Probar la Implementación**

#### Probar RBAC:
```bash
# Intentar acceder a endpoint admin sin autenticación
curl -X GET http://localhost:3000/api/admin/stats
# Debe devolver 401 Unauthorized

# Intentar ejecutar scripts sin ser super_admin
curl -X POST http://localhost:3000/api/admin/scripts \
  -H "Content-Type: application/json" \
  -d '{"action": "seed"}'
# Debe devolver 403 Forbidden si no eres super_admin
```

#### Probar Rate Limiting:
```bash
# Intentar hacer múltiples requests a /api/recipes/search
for i in {1..3}; do
  curl -X POST http://localhost:3000/api/recipes/search \
    -H "Content-Type: application/json" \
    -d '{"ingredients": ["pollo", "arroz"]}'
  sleep 1
done
# El segundo request debe devolver 429 Too Many Requests
```

#### Verificar Audit Logs:
```sql
SELECT * FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🔐 Endpoints Protegidos

### **Requieren Rol Admin:**
- `GET/POST /api/admin/recipes`
- `GET/PUT/DELETE /api/admin/recipes/[id]`
- `DELETE /api/admin/recipes/[id]/delete-image`
- `GET/POST /api/admin/recipes/generate-images`
- `GET /api/admin/recipes/generate-images/preview`
- `GET /api/admin/stats`
- `GET/POST /api/admin/users` (crear usuarios)

### **Requieren Rol Super Admin:**
- `DELETE /api/admin/users` (eliminar usuarios)
- `GET/POST /api/admin/scripts`
- `POST /api/admin/images/reset-monthly-limit`

### **Rate Limiting Aplicado:**
| Endpoint | Límite | Ventana |
|----------|--------|---------|
| `/api/recipes/search` | 1 request | 1 minuto |
| `/api/analytics/track` | 20 requests | 1 minuto |
| `/api/leads/subscribe` | 3 requests | 1 hora |
| `/api/recipes/autocomplete` | 60 requests | 1 minuto |
| `/api/recipes/random` | 20 requests | 1 minuto |
| `/api/recipes/filter` | 20 requests | 1 minuto |

## 📊 Audit Logging

Todas las siguientes acciones se registran automáticamente:

- ✅ Creación/eliminación de usuarios admin
- ✅ Creación/actualización/eliminación de recetas
- ✅ Eliminación de imágenes de recetas
- ✅ Generación de imágenes con IA
- ✅ Reseteo de límites mensuales
- ✅ Ejecución de scripts del sistema

Cada entrada de log incluye:
- ID y nombre del usuario
- Acción realizada
- Tipo y ID del recurso afectado
- Dirección IP
- User agent
- Timestamp
- Detalles adicionales en formato JSON

## 🚧 Limitaciones Actuales

### **Rate Limiter In-Memory:**
- ⚠️ Se reinicia al reiniciar el servidor
- ⚠️ No funciona en entornos serverless distribuidos
- ⚠️ IP puede ser evadida con VPN/proxies

**Recomendación para Producción:**
- Migrar a Redis con `@upstash/ratelimit`
- Implementar fingerprinting del navegador
- Considerar Cloudflare para rate limiting a nivel de CDN

### **SQL Injection:**
- ✅ **Protegido** - Todas las queries usan parámetros
- ✅ Sin riesgo actual

### **CSRF Protection:**
- ⚠️ No implementado en esta fase
- **Próximos Pasos:** Implementar tokens CSRF o validación de Origin header

### **2FA/MFA:**
- ⚠️ No implementado
- **Recomendación:** Agregar 2FA para cuentas super_admin

## 📈 Monitoreo Recomendado

### **Queries útiles para monitoreo:**

```sql
-- Ver intentos recientes de acciones administrativas
SELECT 
  username, 
  action, 
  resource_type, 
  created_at 
FROM audit_logs 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Detectar múltiples acciones del mismo usuario en corto tiempo
SELECT 
  username, 
  COUNT(*) as action_count,
  MIN(created_at) as first_action,
  MAX(created_at) as last_action
FROM audit_logs 
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY username
HAVING COUNT(*) > 50;

-- Ver eliminaciones de recetas
SELECT * FROM audit_logs 
WHERE action = 'recipe_deleted'
ORDER BY created_at DESC;

-- Ver creaciones de usuarios admin
SELECT * FROM audit_logs 
WHERE action = 'user_created'
ORDER BY created_at DESC;
```

## 🔄 Próximos Pasos Recomendados

### **Alta Prioridad:**
1. Implementar rate limiting con Redis (producción)
2. Agregar protección CSRF
3. Implementar 2FA para super_admins
4. Configurar alertas para acciones sospechosas

### **Media Prioridad:**
5. Agregar CAPTCHA a `/api/leads/subscribe`
6. Implementar session timeout configurable
7. Agregar políticas de retención de datos (GDPR)
8. Crear dashboard de audit logs en el backoffice

### **Baja Prioridad:**
9. Implementar rotation de secrets
10. Agregar health checks para servicios externos
11. Documentar políticas de seguridad
12. Realizar penetration testing

## 🆘 Rollback

Si surge algún problema después del deployment:

```sql
-- Rollback de columna role (si es necesario)
ALTER TABLE admin_users DROP COLUMN IF EXISTS role;

-- Eliminar tabla de audit logs
DROP TABLE IF EXISTS audit_logs;
```

**NOTA:** Esto deshabilitará toda la protección RBAC. Solo hacer en caso de emergencia.

## ✅ Checklist Final

Antes de desplegar a producción:

- [ ] Ejecutar `npm run security-setup`
- [ ] Verificar que existe al menos un super_admin
- [ ] Probar acceso a endpoints admin con usuarios de diferentes roles
- [ ] Verificar que rate limiting funciona correctamente
- [ ] Revisar logs de audit_logs después de pruebas
- [ ] Actualizar documentación de API con nuevos requisitos de autorización
- [ ] Notificar al equipo sobre nuevos roles y permisos
- [ ] Configurar alertas de monitoreo
- [ ] Hacer backup de la base de datos antes del deployment

## 📞 Soporte

Si encuentras algún problema:

1. Revisar logs de audit_logs para identificar acciones recientes
2. Verificar roles de usuarios en la tabla admin_users
3. Consultar el código en `lib/auth-helpers.ts` y `lib/audit-logger.ts`
4. Revisar configuración de rate limiting en `lib/rate-limiter-enhanced.ts`

---

**Última actualización:** 13 de enero de 2026
**Versión:** 1.0.0
**Estado:** Listo para deployment
