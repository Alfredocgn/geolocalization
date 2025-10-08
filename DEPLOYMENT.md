# 🚀 Guía de Deployment - GeoChallenge

## ⚡ Quick Start (5 minutos)

### Paso 1: Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp ENV.example.txt .env

# Editar si es necesario (opcional)
nano .env
```

### Paso 2: Levantar con Docker

```bash
# Construir y levantar todos los servicios
docker-compose up -d --build

# Ver logs en tiempo real
docker-compose logs -f
```

### Paso 3: Verificar

```bash
# Verificar que todos los servicios estén corriendo
docker-compose ps

# Deberías ver:
# geochallenge_db        Up (healthy)
# geochallenge_backend   Up (healthy)
# geochallenge_frontend  Up
```

### Paso 4: Acceder

Abre tu navegador en: **http://localhost**

---

## 🔍 Verificación de Servicios

### Backend Health Check

```bash
curl http://localhost:3000/clients
```

**Respuesta esperada:** `[]` (array vacío si no hay clientes)

### Frontend Health Check

```bash
curl http://localhost
```

**Respuesta esperada:** HTML de la aplicación

### Database Health Check

```bash
docker-compose exec postgres pg_isready -U postgres
```

**Respuesta esperada:** `postgres:5432 - accepting connections`

---

## 🛠️ Comandos Útiles

### Ver logs

```bash
# Todos los servicios
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo base de datos
docker-compose logs -f postgres

# Solo frontend
docker-compose logs -f frontend
```

### Reiniciar servicios

```bash
# Reiniciar todo
docker-compose restart

# Reiniciar solo el backend
docker-compose restart backend
```

### Reconstruir después de cambios

```bash
# Reconstruir e iniciar
docker-compose up -d --build

# Reconstruir sin cache
docker-compose build --no-cache
docker-compose up -d
```

### Detener y limpiar

```bash
# Detener servicios
docker-compose down

# Detener y eliminar volúmenes (⚠️ elimina la base de datos)
docker-compose down -v

# Detener y eliminar imágenes
docker-compose down --rmi all
```

---

## 🐛 Troubleshooting

### Error: "Cannot connect to database"

**Causa:** El backend intentó conectarse antes de que PostgreSQL esté listo.

**Solución:**

```bash
# El healthcheck debería prevenir esto, pero si pasa:
docker-compose restart backend
```

### Error: "Port 3000 already in use"

**Causa:** Ya hay algo corriendo en el puerto 3000.

**Solución:**

```bash
# Cambiar puerto en .env
BACKEND_PORT=3001

# Actualizar también el frontend
VITE_API_BASE_URL=http://localhost:3001

# Reconstruir
docker-compose up -d --build
```

### Error: "CORS policy"

**Causa:** El frontend no puede comunicarse con el backend.

**Solución:** Verificar que el backend tenga configurado CORS correctamente (ya está configurado en `main.ts`).

### Los cambios no se reflejan

**Causa:** Docker está usando imágenes cacheadas.

**Solución:**

```bash
# Reconstruir sin cache
docker-compose build --no-cache
docker-compose up -d
```

---

## 📦 Build de Producción

### Variables de entorno para producción

```bash
# .env.production
NODE_ENV=production
DATABASE_HOST=your-postgres-host
DATABASE_PORT=5432
DATABASE_NAME=geochallenge
DATABASE_USERNAME=your-user
DATABASE_PASSWORD=your-secure-password

BACKEND_PORT=3000
FRONTEND_PORT=80
VITE_API_BASE_URL=https://your-api-domain.com
```

### Deploy con Docker Compose

```bash
# Usar archivo de producción
docker-compose -f docker-compose.yml up -d --build
```

---

## 🔐 Seguridad

### Para Producción

1. **Cambiar contraseñas de base de datos**

```bash
DATABASE_PASSWORD=<contraseña-segura>
```

2. **Usar HTTPS**

- Configurar certificados SSL en nginx
- Actualizar CORS en el backend

3. **Variables de entorno**

- NO subir `.env` a Git
- Usar secrets en tu plataforma de deployment

4. **Límites de recursos**

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: 512M
```

---

## 📊 Monitoreo

### Ver uso de recursos

```bash
docker stats
```

### Ver espacio usado

```bash
docker system df
```

### Ver logs de un servicio específico

```bash
# Últimas 100 líneas del backend
docker-compose logs --tail=100 backend

# Seguir logs en tiempo real
docker-compose logs -f backend
```

---

## 🎯 Checklist Pre-Deployment

- [ ] Variables de entorno configuradas
- [ ] Tests pasando (`npm test`)
- [ ] Build exitoso (`docker-compose build`)
- [ ] Health checks funcionando
- [ ] CORS configurado correctamente
- [ ] Contraseñas de producción seguras
- [ ] README.md actualizado
- [ ] .env NO está en Git

---

## 📞 Soporte

Si encuentras algún problema, revisa:

1. Los logs: `docker-compose logs -f`
2. El estado: `docker-compose ps`
3. La sección de Troubleshooting arriba

---

## ⏱️ Tiempos de Procesamiento

- **CSV de 100 clientes**: ~2-3 minutos
  - Parseo: ~1 segundo
  - Geocodificación: ~100 segundos (1 req/seg)
- **CSV de 1000 clientes**: ~20-25 minutos
  - Parseo: ~5 segundos
  - Geocodificación: ~1000 segundos (16.6 minutos)

**Nota:** El rate limit de Nominatim es el cuello de botella principal.
