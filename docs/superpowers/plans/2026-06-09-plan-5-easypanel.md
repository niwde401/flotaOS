# FlotaOS — Plan 5: Deploy EasyPanel (2026-06-10)

**Goal:** Desplegar FlotaOS MVP en EasyPanel con todos los servicios operativos: PostgreSQL, Redis, MinIO, API y Web. Verificar con smoke test y E2E completo en producción.

**Arquitectura de producción:**
- EasyPanel despliega cada servicio **individualmente** desde su Dockerfile (no usa docker-compose.prod.yml — ese es solo referencia)
- Servicios se comunican por nombre de servicio interno (red Docker de EasyPanel)
- Traefik maneja routing + SSL automático por dominio

---

## SECCIÓN 0: Prueba local pre-deploy (opcional, HOY)

Confirmar que la API y Web arrancan con JS compilado antes de llegar a EasyPanel.

### Step 1: Compilar y arrancar API en modo producción

```powershell
cd C:\Proyectos\FlotaOS\apps\api
npx tsc                  # genera dist/
node dist/index.js       # arranca con PostgreSQL portable local
```

Logs esperados:
```
PostgreSQL connected
MinIO disabled (dev mode) — photo uploads skipped
Redis disabled (dev mode) — BullMQ jobs skipped
API running on port 3001
```

### Step 2: Compilar y arrancar Web en modo producción

```powershell
cd C:\Proyectos\FlotaOS\apps\web
npx next build           # ya corrió antes — puede omitirse
npx next start           # http://localhost:3000
```

Verificar: login funciona, las 4 páginas del dashboard cargan.

### Step 3: Parar servidores

```powershell
# Ctrl+C en ambas terminales
```

---

## SECCIÓN 1: Prerrequisitos (antes de abrir EasyPanel)

### Step 1: VPS y EasyPanel instalado

- VPS Linux con mínimo **2 GB RAM** (recomendado 4 GB para todos los servicios)
- EasyPanel instalado en el VPS: `curl -sSL https://get.easypanel.io | sh`
- Acceso al panel en `http://IP_VPS:3000` o `https://panel.TU_DOMINIO.com`

### Step 2: Conectar GitHub a EasyPanel

1. EasyPanel → **Settings** → **GitHub**
2. Click **Connect GitHub**
3. Autorizar la OAuth app de EasyPanel en GitHub
4. Confirmar que aparece la cuenta `niwde401`

> Sin este paso, EasyPanel no puede clonar el repositorio.

### Step 3: Configurar DNS

En tu proveedor de DNS (Cloudflare, GoDaddy, etc.):

| Registro | Nombre | Valor | TTL |
|----------|--------|-------|-----|
| A | `api` | `IP_DE_TU_VPS` | Auto |
| A | `app` | `IP_DE_TU_VPS` | Auto |

Verificar propagación:
```powershell
Resolve-DnsName api.TU_DOMINIO.com
Resolve-DnsName app.TU_DOMINIO.com
```

### Step 4: Preparar variables de entorno

1. Copiar `.env.production.example` como `.env.production` (local, nunca al repo)
2. Generar los JWT secrets:
   ```powershell
   # Ejecutar DOS veces — copiar cada resultado
   [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
   ```
3. Rellenar todos los campos marcados con `CAMBIAR_*`
4. Tener el archivo abierto durante el deploy para copiar valores

---

## SECCIÓN 2: Crear servicios en EasyPanel

> Todos los servicios van dentro del mismo **Proyecto** en EasyPanel.
> Crear primero: **Projects → + New Project → nombre: `flotaos`**

### Step 1: PostgreSQL

1. **+ New Service → Postgres**
2. Name: `flotaos-postgres`
3. Image: `postgres:15-alpine`
4. Database: `flotaos_db` | User: `flotaos` | Password: `CAMBIAR_PASSWORD_DB`
5. **Deploy** → esperar estado `running`

### Step 2: Redis

1. **+ New Service → Redis**
2. Name: `flotaos-redis`
3. Image: `redis:7-alpine`
4. **Deploy** → esperar estado `running`

### Step 3: MinIO

1. **+ New Service → App** (custom)
2. Name: `flotaos-minio`
3. Image: `minio/minio`
4. Command: `server /data --console-address ":9001"`
5. Ports: `9000` (API) y `9001` (console)
6. Variables de entorno:
   ```
   MINIO_ROOT_USER=flotaos_minio
   MINIO_ROOT_PASSWORD=CAMBIAR_PASSWORD_MINIO
   ```
7. Volume: `/data` → habilitar persistencia
8. **Deploy** → esperar estado `running`

> El bucket `flotaos-photos` **se crea automáticamente** cuando la API arranque por primera vez.
> No necesitas crearlo manualmente.

### Step 4: API

1. **+ New Service → App** (GitHub)
2. Name: `flotaos-api`
3. Repository: `niwde401/flotaOS` | Branch: `main`
4. Dockerfile path: `apps/api/Dockerfile`
5. Build context: `.` ← raíz del repo, no cambiar
6. Port: `3001`
7. Variables de entorno — pegar todo el bloque:
   ```
   DATABASE_URL=postgresql://flotaos:CAMBIAR_PASSWORD_DB@flotaos-postgres:5432/flotaos_db
   REDIS_URL=redis://flotaos-redis:6379
   JWT_SECRET=TU_SECRET_GENERADO
   JWT_REFRESH_SECRET=TU_REFRESH_SECRET_GENERADO
   MINIO_ENDPOINT=flotaos-minio
   MINIO_PORT=9000
   MINIO_USE_SSL=false
   MINIO_ACCESS_KEY=flotaos_minio
   MINIO_SECRET_KEY=CAMBIAR_PASSWORD_MINIO
   MINIO_BUCKET=flotaos-photos
   WEB_URL=https://app.TU_DOMINIO.com
   CLAUDE_API_KEY=sk-ant-XXXXXXXX
   NODE_ENV=production
   API_PORT=3001
   ```
8. Domain: `api.TU_DOMINIO.com` → habilitar HTTPS
9. Health check path: `/health`
10. **Deploy** → esperar build completo (3–5 min primera vez)

### Step 5: Web

1. **+ New Service → App** (GitHub)
2. Name: `flotaos-web`
3. Repository: `niwde401/flotaOS` | Branch: `main`
4. Dockerfile path: `apps/web/Dockerfile`
5. Build context: `.`
6. Port: `3000`
7. Variables de entorno:
   ```
   NODE_ENV=production
   API_URL=http://flotaos-api:3001
   NEXT_PUBLIC_API_URL=https://api.TU_DOMINIO.com
   ```
8. Domain: `app.TU_DOMINIO.com` → habilitar HTTPS
9. **Deploy** → esperar build completo (3–5 min)

---

## SECCIÓN 3: Post-deploy — Migraciones y Seed

### Step 1: Ejecutar migraciones

En EasyPanel → servicio `flotaos-api` → **Terminal** (o **Console**):

```bash
npx prisma migrate deploy
```

Esperado:
```
1 migration applied: 20260605222840_init_complete_schema
```

> Si ya corrió antes (redeploy), dirá "No pending migrations" — eso es correcto.

### Step 2: Ejecutar seed (solo primera vez)

En la misma terminal del servicio `flotaos-api`:

```bash
npm run seed
```

Esperado:
```
Seed complete. Users: director@yofc.pe, coord@yofc.pe, driver@yofc.pe (all pw: Admin1234!)
```

> `npm run seed` usa `ts-node prisma/seed.ts`. ts-node está disponible en el contenedor
> porque el Dockerfile copia todos los `node_modules` del builder stage.

> **No ejecutar dos veces** — `zone.create` y `team.create` fallarían con unique constraint.
> Si necesitas re-seedear: `npx prisma migrate reset` (borra todos los datos).

---

## SECCIÓN 4: Verificación en producción

### Step 1: Health check API

```powershell
Invoke-RestMethod https://api.TU_DOMINIO.com/health
# Esperado: {"status":"ok","ts":"..."}
```

### Step 2: Login desde la web

1. Abrir `https://app.TU_DOMINIO.com`
2. Login con `coord@yofc.pe` / `Admin1234!`
3. Verificar que cargan: Dashboard KPI, Caja Chica, Mantenimiento, Vehículos

### Step 3: E2E trip flow vía API

```powershell
$base = "https://api.TU_DOMINIO.com"

# 1. Login coord
$coord = Invoke-RestMethod -Uri "$base/auth/login" -Method Post `
  -Body '{"email":"coord@yofc.pe","password":"Admin1234!"}' -ContentType "application/json"
$hCoord = @{ Authorization = "Bearer $($coord.data.accessToken)"; "Content-Type" = "application/json" }

# 2. Crear viaje
$trip = Invoke-RestMethod -Uri "$base/api/trips" -Method Post -Headers $hCoord -Body (@{
    vehicleId   = (Invoke-RestMethod -Uri "$base/api/vehicles" -Headers $hCoord).data[0].id
    teamId      = (Invoke-RestMethod -Uri "$base/api/teams" -Headers $hCoord).data[0].id
    driverId    = "782da0e6-ded7-4f67-b38e-115dd255e142"  # driver del seed
    origin      = "Lima - HQ"
    destination = "Piura - Nodo 14"
    tripDate    = (Get-Date).ToString("yyyy-MM-dd")
} | ConvertTo-Json)
$tripId = $trip.data.id
Write-Host "Trip: $tripId"

# 3. Login driver
$driver = Invoke-RestMethod -Uri "$base/auth/login" -Method Post `
  -Body '{"email":"driver@yofc.pe","password":"Admin1234!"}' -ContentType "application/json"
$hDriver = @{ Authorization = "Bearer $($driver.data.accessToken)"; "Content-Type" = "application/json" }

# 4. Evento llegada_sitio
Invoke-RestMethod -Uri "$base/api/trips/$tripId/events" -Method Post -Headers $hDriver `
  -Body (@{ eventType="llegada_sitio"; latitude=-12.046374; longitude=-77.042793 } | ConvertTo-Json)

# 5. Verificar
$events = Invoke-RestMethod -Uri "$base/api/trips/$tripId/events" -Headers $hDriver
Write-Host "Eventos: $($events.data.Count)"
```

### Step 4: Verificar foto upload (MinIO)

En la terminal del servicio `flotaos-api`:

```bash
# Verificar que el bucket existe
node -e "const {minioClient,BUCKET} = require('./lib/minio'); minioClient.bucketExists(BUCKET).then(console.log)"
# Esperado: true
```

### Step 5: Verificar KPI workers (Redis + BullMQ)

```powershell
# Debe retornar datos KPI tras ejecutarse el worker diario
Invoke-RestMethod -Uri "https://api.TU_DOMINIO.com/api/kpis/fleet-summary" `
  -Headers @{ Authorization = "Bearer $($coord.data.accessToken)" }
```

---

## SECCIÓN 5: Configurar Mobile para producción

En `apps/mobile/src/config.ts` el valor por defecto es `localhost:3001`. Para apuntar a producción:

### Opción A — Variable de entorno Expo (recomendada)

Crear `apps/mobile/.env`:
```env
EXPO_PUBLIC_API_URL=https://api.TU_DOMINIO.com
```

Luego hacer commit y rebuild de la app.

### Opción B — Cambio directo en config.ts

```typescript
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.TU_DOMINIO.com'
```

---

## SECCIÓN 6: Auto-deploy con GitHub (opcional)

Para que cada push a `main` redesplegue automáticamente:

1. EasyPanel → servicio `flotaos-api` → **General**
2. Habilitar **Auto Deploy** → Branch: `main`
3. Repetir para `flotaos-web`

> Cada merge a `main` disparará un rebuild. Las migraciones se deben ejecutar manualmente
> después de cada deploy que incluya cambios de schema.

---

## Checklist final

**Prerrequisitos:**
- [ ] VPS con ≥ 2 GB RAM y EasyPanel instalado
- [ ] GitHub conectado a EasyPanel (OAuth)
- [ ] DNS: `api.TU_DOMINIO.com` y `app.TU_DOMINIO.com` apuntando al VPS

**Servicios:**
- [ ] `flotaos-postgres` running
- [ ] `flotaos-redis` running
- [ ] `flotaos-minio` running
- [ ] `flotaos-api` running en `https://api.TU_DOMINIO.com`
- [ ] `flotaos-web` running en `https://app.TU_DOMINIO.com`

**Post-deploy:**
- [ ] `npx prisma migrate deploy` ejecutado en API
- [ ] `npm run seed` ejecutado (solo primera vez)

**Verificación:**
- [ ] `/health` retorna `{"status":"ok"}`
- [ ] Login en web funciona
- [ ] 4 páginas del dashboard cargan
- [ ] E2E trip flow desde API
- [ ] Bucket MinIO `flotaos-photos` creado automáticamente
- [ ] Mobile apunta a URL de producción
