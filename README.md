# 🌍 GeoChallenge - Sistema de Geocodificación de Clientes

Sistema completo para la gestión y geocodificación automática de direcciones de clientes mediante la carga de archivos CSV.

## 📋 Características

- ✅ **ABM de Clientes**: Alta, Baja, Modificación completo
- ✅ **Carga por CSV**: Procesamiento automático de archivos CSV
- ✅ **Geocodificación Automática**: Integración con Nominatim (OpenStreetMap)
- ✅ **Detección de Ambigüedades**: Identificación de direcciones con múltiples resultados
- ✅ **Procesamiento en Background**: Carga no bloqueante con seguimiento en tiempo real
- ✅ **Rate Limit Control**: Respeto del límite de 1 req/seg de Nominatim
- ✅ **Tests Unitarios**: 45 tests que cubren casos borde
- ✅ **Docker Ready**: Deployment completo con docker-compose

## 🛠️ Stack Tecnológico

### Backend

- **NestJS** 11 - Framework Node.js
- **TypeORM** - ORM para PostgreSQL
- **PostgreSQL** 15 - Base de datos
- **Axios** - Cliente HTTP
- **csv-parser** - Procesamiento de CSV

### Frontend

- **React** 18 + TypeScript
- **Vite** - Build tool
- **TailwindCSS** - Estilos
- **Custom Hooks** - Gestión de estado

### DevOps

- **Docker** & **Docker Compose**
- **Nginx** - Servidor web para producción

## 🚀 Quick Start con Docker

### Requisitos Previos

- Docker >= 20.10
- Docker Compose >= 2.0

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd geochallenge
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
# Database Configuration
DATABASE_NAME=geochallenge
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_PORT=5432

# Backend Configuration
BACKEND_PORT=3000

# Frontend Configuration
FRONTEND_PORT=80
VITE_API_BASE_URL=http://localhost:3000

# External APIs
NOMINATIM_URL=https://nominatim.openstreetmap.org/search
```

### 3. Levantar los servicios

```bash
docker-compose up -d
```

Esto levantará:

- 🐘 **PostgreSQL** en `localhost:5432`
- 🚀 **Backend** en `localhost:3000`
- 🌐 **Frontend** en `localhost:80`

### 4. Verificar que todo está funcionando

```bash
# Ver logs
docker-compose logs -f

# Ver estado de los servicios
docker-compose ps
```

### 5. Acceder a la aplicación

Abre tu navegador en: **http://localhost**

---

## 💻 Desarrollo Local (sin Docker)

### Requisitos

- Node.js >= 20
- PostgreSQL >= 15
- npm >= 10

### Backend

```bash
cd server

# Instalar dependencias
npm install

# Configurar base de datos
# Crear archivo .env con:
# DATABASE_HOST=localhost
# DATABASE_PORT=5432
# DATABASE_NAME=geochallenge
# DATABASE_USERNAME=postgres
# DATABASE_PASSWORD=postgres

# Levantar PostgreSQL (si usas Docker)
docker-compose up postgres -d

# Correr migraciones (automáticas con TypeORM)
# Ejecutar en modo desarrollo
npm run start:dev
```

Backend disponible en: `http://localhost:3000`

### Frontend

```bash
cd client

# Instalar dependencias
npm install

# Crear archivo .env con:
echo "VITE_API_BASE_URL=http://localhost:3000" > .env

# Ejecutar en modo desarrollo
npm run dev
```

Frontend disponible en: `http://localhost:5173`

---

## 🧪 Tests

### Backend

```bash
cd server

# Ejecutar todos los tests
npm test

# Tests con coverage
npm run test:cov

# Tests en modo watch
npm run test:watch
```

**Cobertura de tests:**

- ✅ 11 tests - UploadService (validación CSV, datos incompletos)
- ✅ 15 tests - GeocodingService (errores API, timeouts, rate limit)
- ✅ 19 tests - ClientsService (CRUD, geocodificación, ambigüedades)

---

## 📁 Formato de CSV

### Ejemplo 1: Formato Inglés (delimitado por comas)

```csv
name,lastName,street,city,province,country
Juan,Pérez,Av. Corrientes 348,Buenos Aires,CABA,Argentina
María,González,Florida 537,Buenos Aires,CABA,Argentina
```

### Ejemplo 2: Formato Español (delimitado por punto y coma)

```csv
Cliente;Calle y altura;Ciudad;Provincia;País
Raúl Perez;Av. Corrientes 348;Buenos Aires;CABA;Argentina
María López;Florida 537;Buenos Aires;CABA;Argentina
```

### Campos Requeridos

- ✅ `name` o `Nombre` o parte de `Cliente`
- ✅ `lastName` o `Apellido` o parte de `Cliente`
- ✅ `street` o `Calle y altura`
- ✅ `city` o `Ciudad`
- ✅ `province` o `Provincia`
- ✅ `country` o `País` o `Pais`

**Nota:** El sistema detecta automáticamente el delimitador (`,` o `;`) y normaliza los nombres de las columnas.

---

## 🗺️ Geocodificación

### Estados de Geocodificación

| Estado         | Descripción                      | Acción del Usuario             |
| -------------- | -------------------------------- | ------------------------------ |
| 🟡 `pending`   | Esperando geocodificación        | Ninguna                        |
| 🟢 `success`   | Geocodificado exitosamente       | Ninguna                        |
| 🟠 `ambiguous` | Múltiples resultados encontrados | Seleccionar resultado correcto |
| 🔴 `failed`    | No se encontró la dirección      | Corregir dirección manualmente |

### API de Geocodificación

Se utiliza **Nominatim** (OpenStreetMap), que es gratuita pero tiene un rate limit de **1 request/segundo**.

El sistema respeta este límite procesando los clientes en cola con un delay de 1 segundo entre cada uno.

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────┐
│         Frontend (React + Vite)         │
│  - UI Components                        │
│  - Custom Hooks                         │
│  - Real-time Progress Tracking          │
└──────────────┬──────────────────────────┘
               │ REST API (HTTP)
               ↓
┌─────────────────────────────────────────┐
│       Backend (NestJS + TypeORM)        │
│  ┌─────────────────────────────────┐   │
│  │  Clients Module                 │   │
│  │  - CRUD Operations              │   │
│  │  - Address Updates              │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  Upload Module                  │   │
│  │  - CSV Processing               │   │
│  │  - Background Jobs              │   │
│  │  - Progress Tracking            │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  Geocoding Module               │   │
│  │  - Nominatim Integration        │   │
│  │  - Rate Limit Control           │   │
│  │  - Queue Management             │   │
│  └─────────────────────────────────┘   │
└──────────────┬──────────────────────────┘
               │ TypeORM
               ↓
┌─────────────────────────────────────────┐
│         PostgreSQL Database             │
│  - Client Entity (JSONB for results)   │
│  - Geocoding Status Tracking            │
└─────────────────────────────────────────┘
               ↑
               │ HTTP Requests
┌──────────────┴──────────────────────────┐
│     Nominatim API (OpenStreetMap)       │
│  - Free geocoding service               │
│  - Rate limit: 1 req/sec                │
└─────────────────────────────────────────┘
```

---

## 📊 Base de Datos

### Modelo Client

```typescript
{
  id: UUID,
  name: string,
  lastName: string,
  street: string,
  city: string,
  province: string,
  country: string,
  latitude: decimal(10,7) | null,
  longitude: decimal(10,7) | null,
  geocodingStatus: 'pending' | 'success' | 'ambiguous' | 'failed',
  geocodingResults: JSONB | null,  // Resultados de Nominatim
  notes: string | null,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Ventajas de usar JSONB:**

- Deserialización automática por TypeORM
- Queries SQL sobre el contenido JSON
- Validación a nivel de base de datos
- Mejor performance que TEXT

---

## 🔧 Comandos Útiles

### Docker

```bash
# Levantar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f [servicio]

# Reiniciar un servicio
docker-compose restart [servicio]

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v

# Reconstruir imágenes
docker-compose build --no-cache

# Ver estado
docker-compose ps
```

### Base de Datos

```bash
# Acceder a PostgreSQL
docker-compose exec postgres psql -U postgres -d geochallenge

# Backup
docker-compose exec postgres pg_dump -U postgres geochallenge > backup.sql

# Restore
docker-compose exec -T postgres psql -U postgres geochallenge < backup.sql
```

---

## 📝 API Endpoints

### Clients

```
GET    /clients              - Listar todos los clientes
GET    /clients/:id          - Obtener un cliente
GET    /clients/issues       - Clientes con problemas de geocodificación
POST   /clients              - Crear cliente
PATCH  /clients/:id          - Actualizar cliente (sin re-geocodificar)
PATCH  /clients/:id/address  - Actualizar dirección (re-geocodifica)
PATCH  /clients/:id/select-result - Seleccionar resultado ambiguo
DELETE /clients/:id          - Eliminar cliente
POST   /clients/:id/geocode  - Re-geocodificar manualmente
```

### Upload

```
POST   /upload/csv           - Subir archivo CSV
GET    /upload/progress/:id  - Obtener progreso de carga
GET    /upload/geocoding     - Obtener progreso global de geocodificación
```

---

## 🎯 Casos de Uso

### 1. Cargar CSV con clientes

1. Usuario hace clic en "📁 Upload CSV"
2. Selecciona archivo CSV
3. Sistema procesa en background:
   - Detecta delimitador automáticamente
   - Normaliza nombres de columnas
   - Valida campos requeridos
   - Crea clientes con status `pending`
4. Usuario ve progreso en tiempo real
5. Sistema geocodifica automáticamente (1 req/seg)

### 2. Resolver dirección ambigua

1. Cliente aparece en sección "Clients with Geocoding Issues"
2. Usuario hace clic en "🔽 Options"
3. Sistema muestra múltiples resultados posibles
4. Usuario selecciona el correcto
5. Cliente pasa a estado `success` con coordenadas

### 3. Corregir dirección fallida

1. Cliente con estado `failed` en sección de problemas
2. Usuario hace clic en "📍 Fix Address"
3. Corrige la dirección
4. Sistema re-geocodifica automáticamente

---

## 🚨 Troubleshooting

### El backend no se conecta a la base de datos

```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps postgres

# Ver logs de PostgreSQL
docker-compose logs postgres

# Verificar variables de entorno
docker-compose config
```

### Nominatim devuelve 429 (Rate Limit)

El sistema respeta el rate limit de 1 req/seg, pero si haces múltiples uploads simultáneos puedes excederlo.

**Solución:** Espera unos minutos antes de subir otro CSV.

### El frontend no se comunica con el backend

Verifica que `VITE_API_BASE_URL` esté configurado correctamente:

- Desarrollo: `http://localhost:3000`
- Producción: URL de tu backend

---

## 🤝 Decisiones de Diseño

### 1. Procesamiento en Background

**Por qué:** Un CSV grande no debe bloquear la respuesta HTTP. El usuario recibe un `uploadId` inmediatamente y puede hacer seguimiento del progreso.

### 2. Cola de Geocodificación

**Por qué:** Controla el rate limit de Nominatim, evita bloqueos y es resiliente a errores.

### 3. JSONB para resultados

**Por qué:** Deserialización automática, queries SQL sobre JSON, validación en DB, mejor performance.

### 4. Validación en el Servicio

**Por qué:** El Controller solo valida HTTP, el Servicio valida lógica de negocio. Separación de responsabilidades.

### 5. Estado "ambiguous"

**Por qué:** El operario necesita contexto para decidir. No se pierde información de opciones disponibles.

---

## 📄 Licencia

Este proyecto fue desarrollado como parte de un desafío técnico.

---

## 👤 Autor

Alfredo González
