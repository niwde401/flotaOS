# FlotaOS — Plan 5: Deploy EasyPanel (2026-06-10)

**Goal:** Desplegar FlotaOS MVP en EasyPanel con todos los servicios: PostgreSQL, Redis, MinIO, API y Web. Verificar que el sistema funciona en producción con las mismas pruebas del E2E local.

**Prerequisito:** Cuenta de EasyPanel con un VPS Linux accesible (mínimo 2GB RAM). Repositorio `niwde401/flotaOS` en GitHub (ya existe).

---

## SECCIÓN 0: Prueba local pre-deploy (HOY, antes de EasyPanel)

Probar que la API arranca en modo producción real (JS compilado, no ts-node-dev).

### Step 1: Compilar la API

```powershell
cd C:\Proyectos\FlotaOS\apps\api
npx tsc
```

Esperado: carpeta `dist/` generada sin errores.

### Step 2: Arrancar en modo producción

```powershell
# PostgreSQL ya corriendo en local
cd C:\Proyectos\FlotaOS\apps\api
node dist/index.js
```

Logs esperados:
```
PostgreSQL connected
MinIO disabled (dev mode)
Redis disabled (dev mode)
API running on port 3001
```

### Step 3: Smoke test producción local

```powershell
Invoke-RestMethod http://localhost:3001/health
```

### Step 4: Compilar y arrancar Web en producción

```powershell
cd C:\Proyectos\FlotaOS\apps\web
npx next build
npx next start
# Abrir http://localhost:3000
```

Verificar: login funciona, dashboard carga, 4 páginas operativas.

### Step 5: Parar servidores y volver a dev

```powershell
# Ctrl+C en ambas terminales
cd C:\Proyectos\FlotaOS\apps\api
npx ts-node-dev --respawn src/index.ts
```

---

## SECCIÓN 1: Preparar variables de entorno de producción

### Step 1: Generar secrets seguros

```powershell
# Generar JWT secrets (ejecutar en PowerShell)
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
# Ejecutar DOS VECES: una para JWT_SECRET, otra para JWT_REFRESH_SECRET
```

### Step 2: Completar `.env.production.example`

Ya existe en raíz del repo. Copiar como `.env.production` (NO commitear) y rellenar:

```env
# === BASE DE DATOS ===
DATABASE_URL=postgresql://flotaos:CAMBIAR_PASSWORD@flotaos-postgres:5432/flotaos_db

# === AUTENTICACIÓN ===
JWT_SECRET=GENERAR_CON_OPENSSL_MIN_48_CHARS
JWT_REFRESH_SECRET=GENERAR_CON_OPENSSL_MIN_48_CHARS

# === REDIS ===
REDIS_URL=redis://flotaos-redis:6379

# === MINIO ===
MINIO_ENDPOINT=flotaos-minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=flotaos_minio
MINIO_SECRET_KEY=CAMBIAR_PASSWORD_MINIO
MINIO_BUCKET=flotaos-photos

# === APP ===
NODE_ENV=production
API_PORT=3001
NEXT_PUBLIC_API_URL=https://api.TU_DOMINIO.com
API_URL=http://flotaos-api:3001
```

---

## SECCIÓN 2: Configurar EasyPanel

### Step 1: Crear proyecto en EasyPanel

1. Entrar a EasyPanel → **Projects** → **+ New Project**
2. Nombre: `flotaos`

### Step 2: Crear servicio PostgreSQL

1. **+ New Service** → **Postgres**
2. Name: `flotaos-postgres`
3. Version: `15`
4. Database: `flotaos_db`
5. User: `flotaos`
6. Password: el mismo de `DATABASE_URL`
7. **Deploy**

### Step 3: Crear servicio Redis

1. **+ New Service** → **Redis**
2. Name: `flotaos-redis`
3. Version: `7`
4. **Deploy**

### Step 4: Crear servicio MinIO

1. **+ New Service** → **App** (Docker image)
2. Name: `flotaos-minio`
3. Image: `minio/minio`
4. Command: `server /data --console-address ":9001"`
5. Port: `9000` (API) y `9001` (console)
6. Variables de entorno:
   ```
   MINIO_ROOT_USER=flotaos_minio
   MINIO_ROOT_PASSWORD=CAMBIAR_PASSWORD_MINIO
   ```
7. Volume: `/data` → persistente
8. **Deploy**

### Step 5: Crear servicio API

1. **+ New Service** → **App** (GitHub)
2. Name: `flotaos-api`
3. Repositorio: `niwde401/flotaOS`
4. Branch: `main`
5. Dockerfile path: `apps/api/Dockerfile`
6. Build context: `.` (raíz del repo)
7. Port: `3001`
8. Variables de entorno: pegar todo el bloque de `.env.production` (sección API)
9. **NO deployar aún** — primero configurar dominio

### Step 6: Configurar dominio API

1. En el servicio `flotaos-api` → **Domains**
2. Añadir: `api.TU_DOMINIO.com`
3. Enable HTTPS (Let's Encrypt automático)

### Step 7: Crear servicio Web

1. **+ New Service** → **App** (GitHub)
2. Name: `flotaos-web`
3. Repositorio: `niwde401/flotaOS`
4. Branch: `main`
5. Dockerfile path: `apps/web/Dockerfile`
6. Build context: `.`
7. Port: `3000`
8. Variables de entorno:
   ```
   NODE_ENV=production
   API_URL=http://flotaos-api:3001
   NEXT_PUBLIC_API_URL=https://api.TU_DOMINIO.com
   ```
9. **Dominio:** `app.TU_DOMINIO.com` (o `TU_DOMINIO.com`)

### Step 8: Deploy en orden

```
1. Deploy flotaos-postgres  → esperar "running"
2. Deploy flotaos-redis     → esperar "running"
3. Deploy flotaos-minio     → esperar "running"
4. Deploy flotaos-api       → esperar build + "running"
5. Deploy flotaos-web       → esperar build + "running"
```

---

## SECCIÓN 3: Post-deploy — Migraciones y Seed

### Step 1: Ejecutar migraciones

En EasyPanel → servicio `flotaos-api` → **Console** o **Terminal**:

```bash
cd /app
npx prisma migrate deploy
```

Esperado: `1 migration applied` (init_complete_schema).

### Step 2: Ejecutar seed (solo primera vez)

```bash
node -e "require('./dist/prisma/seed.js')"
```

O si el seed no fue compilado:

```bash
# Desde la consola del servicio
DATABASE_URL="..." npx ts-node prisma/seed.ts
```

### Step 3: Verificar health

```bash
curl https://api.TU_DOMINIO.com/health
# Esperado: {"status":"ok","ts":"..."}
```

---

## SECCIÓN 4: Pruebas en producción

### Step 1: Smoke test API

```powershell
# Desde local
$r = Invoke-RestMethod -Uri https://api.TU_DOMINIO.com/auth/login -Method Post `
  -Body '{"email":"coord@yofc.pe","password":"Admin1234!"}' `
  -ContentType "application/json"
$r.data.user
```

### Step 2: Smoke test Web

Abrir `https://app.TU_DOMINIO.com`:
- Login con `coord@yofc.pe` / `Admin1234!`
- Verificar: Dashboard KPI, Caja Chica, Mantenimiento, Vehículos

### Step 3: E2E trip flow en producción

```powershell
$base = "https://api.TU_DOMINIO.com"

# Login como driver
$login = Invoke-RestMethod -Uri "$base/auth/login" -Method Post `
  -Body '{"email":"driver@yofc.pe","password":"Admin1234!"}' `
  -ContentType "application/json"
$token = $login.data.accessToken
$h = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

# Crear viaje (como coord)
# ... (mismo flujo que en local)
```

### Step 4: Verificar foto upload (MinIO)

```powershell
# POST a /api/uploads/photo con un archivo real
# Verificar que retorna una URL de MinIO
```

### Step 5: Verificar Mobile apunta a producción

En `apps/mobile/src/config.ts`:
```typescript
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.TU_DOMINIO.com'
```

Actualizar `EXPO_PUBLIC_API_URL` y hacer `expo build` o `eas build`.

---

## SECCIÓN 5: CI/CD con GitHub (opcional, post-MVP)

### Webhook automático

1. En EasyPanel → servicio → **General** → habilitar **Auto Deploy**
2. Branch: `main`
3. Cada push a `main` → rebuild automático

---

## Checklist final

- [ ] PostgreSQL corriendo en EasyPanel
- [ ] Redis corriendo en EasyPanel
- [ ] MinIO corriendo con bucket `flotaos-photos` creado
- [ ] API accesible en `https://api.TU_DOMINIO.com/health`
- [ ] Web accesible en `https://app.TU_DOMINIO.com/login`
- [ ] Migraciones aplicadas (`prisma migrate deploy`)
- [ ] Seed ejecutado (usuarios de prueba disponibles)
- [ ] Login funciona desde el web
- [ ] E2E trip flow desde la API
- [ ] Foto upload funciona (MinIO)
- [ ] Mobile apuntando a URL de producción
