# FlotaOS — Estado del Proyecto
**Última actualización:** 2026-06-09  
**Branch activo:** `main` (MVP mergeado)  
**Commits realizados:** 49 | **Tag:** `v0.1.0-mvp`  
**Repositorio:** https://github.com/niwde401/flotaOS

---

## Estado por Plan

| Plan | Archivo | Estado | Completado |
|------|---------|--------|-----------|
| Plan 1 — Infra & Monorepo | `plans/2026-06-05-plan-1-infra-setup.md` | ✅ COMPLETO | 2026-06-05 |
| Plan 2 — API REST | `plans/2026-06-05-plan-2-api.md` | ✅ COMPLETO | 2026-06-08 |
| Plan 3 — Mobile | `plans/2026-06-05-plan-3-mobile.md` | ✅ COMPLETO | 2026-06-08 |
| Plan 4 — Web Dashboard | `plans/2026-06-05-plan-4-web.md` | ✅ COMPLETO | 2026-06-08 |
| Task 8 — Integration + PR + Tag | — | ✅ COMPLETO | 2026-06-09 |
| **Plan 5 — Deploy EasyPanel** | `plans/2026-06-09-plan-5-easypanel.md` | ⏳ MAÑANA | — |

---

## Entorno de Desarrollo — Configuración Local

### Restricciones del equipo
- **Sin permisos de administrador** — no se puede instalar software con instalador
- **Red corporativa** — bloquea algunos dominios externos (upstash.com, etc.)
- **Docker Desktop** — instalado (v4.76.0) pero **requiere WSL2** → no disponible sin admin
- **WSL2** — no instalado, requiere admin

### Solución adoptada para dev local
| Servicio | Solución | Estado |
|----------|----------|--------|
| PostgreSQL 15 | **Portable** en `C:\Proyectos\postgresql15` | ✅ OK |
| Redis | **Desactivado** (`REDIS_DISABLED=true` en `.env`) | ✅ OK |
| MinIO | **Desactivado** (`MINIO_DISABLED=true` en `.env`) | ✅ OK |
| BullMQ jobs | Deshabilitados en dev (sin Redis) | ✅ OK |
| Socket.io | Funciona sin Redis adapter (1 servidor) | ✅ OK |

---

## Cómo Reiniciar el Entorno (cada sesión)

### 1. Arrancar PostgreSQL portable

```powershell
C:\Proyectos\postgresql15\pgsql\bin\pg_ctl.exe start -D C:\Proyectos\postgresql15\data -l C:\Proyectos\postgresql15\pg.log
```

Verificar:
```powershell
C:\Proyectos\postgresql15\pgsql\bin\pg_isready.exe -h localhost -p 5432
# Debe decir: localhost:5432 - aceptando conexiones
```

### 2. Arrancar la API (modo desarrollo)

```powershell
cd C:\Proyectos\FlotaOS\apps\api
npx ts-node-dev --respawn src/index.ts
```

### 3. (Opcional) Arrancar Web

```powershell
cd C:\Proyectos\FlotaOS\apps\web
npx next dev
# Abre http://localhost:3000
```

### Verificación rápida

```powershell
Invoke-RestMethod http://localhost:3001/health

$r = Invoke-RestMethod -Uri http://localhost:3001/auth/login -Method Post `
  -Body '{"email":"coord@yofc.pe","password":"Admin1234!"}' `
  -ContentType "application/json"
$r.data.user
```

---

## Usuarios de Prueba (seed)

| Email | Password | Rol | ID clave |
|-------|----------|-----|----------|
| `director@yofc.pe` | `Admin1234!` | director | — |
| `coord@yofc.pe` | `Admin1234!` | coordinador | staff.id: `1f30bfe0-...` |
| `driver@yofc.pe` | `Admin1234!` | driver | drivers.id: `782da0e6-...` |

> **Nota:** `trips.driverId` referencia `drivers.id`, **no** `users.id`.

---

## Estructura del Proyecto

```
C:\Proyectos\FlotaOS\
├── apps/
│   ├── api/                    ← Express + Prisma (puerto 3001)
│   │   ├── src/
│   │   │   ├── middleware/     auth.ts, scopeFilter.ts, errorHandler.ts
│   │   │   ├── routes/         auth, vehicles, teams, trips, tripEvents,
│   │   │   │                   uploads, expenses, maintenance, kpis, pettyCash
│   │   │   ├── jobs/           queues.ts, scheduler.ts, workers/kpi + alert
│   │   │   ├── lib/            prisma.ts, redis.ts, minio.ts
│   │   │   └── index.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma   28 tablas completas
│   │   │   ├── migrations/     20260605222840_init_complete_schema
│   │   │   └── seed.ts
│   │   ├── Dockerfile          ← listo para producción
│   │   └── .env
│   ├── web/                    ← Next.js 14 App Router (puerto 3000)
│   │   ├── app/(dashboard)/    dashboard, caja-chica, mantenimiento, vehiculos
│   │   ├── app/login/
│   │   ├── app/api/            auth/login, auth/logout, proxy/[...path]
│   │   ├── components/         KpiCard, Sidebar, OTTable, TransactionTable, etc.
│   │   ├── lib/auth.ts
│   │   ├── middleware.ts
│   │   └── Dockerfile          ← listo para producción
│   └── mobile/                 ← Expo 51 (offline-first)
│       ├── src/api/            client.ts, trips.ts, expenses.ts
│       ├── src/db/             WatermelonDB schema + models
│       ├── src/navigation/     AppNavigator, MainTabs, AuthNavigator
│       ├── src/screens/        Login, Inicio, eventos/, gastos/, Perfil
│       ├── src/hooks/          useLocation.ts, usePhotoUpload.ts
│       └── src/sync/           syncQueue.ts (30s interval)
├── packages/
│   └── shared/                 ← Tipos TypeScript compartidos
├── docs/
│   ├── estado-proyecto.md      ← ESTE ARCHIVO
│   └── superpowers/
│       ├── specs/              2026-06-05-flotaos-design.md
│       └── plans/              plan-1..4 ✅, plan-5-easypanel ⏳
├── docker-compose.yml          (dev reference)
├── docker-compose.prod.yml     ← producción completa
└── C:\Proyectos\postgresql15\  ← PostgreSQL portable (fuera del repo)
```

---

## Rutas API — Estado actual

| Ruta | Método | Estado |
|------|--------|--------|
| `/health` | GET | ✅ |
| `/auth/login` | POST | ✅ |
| `/auth/refresh` | POST | ✅ |
| `/auth/logout` | POST | ✅ |
| `/api/vehicles` | GET, POST, PATCH | ✅ |
| `/api/teams` | GET | ✅ |
| `/api/teams/:id/members` | GET | ✅ |
| `/api/trips` | GET, POST | ✅ |
| `/api/trips/:id/status` | PATCH | ✅ |
| `/api/trips/:id/events` | GET, POST | ✅ (FM + taller) |
| `/api/uploads/photo` | POST | ✅ (requiere MinIO en prod) |
| `/api/expenses` | GET, POST, PATCH | ✅ |
| `/api/maintenance/orders` | GET, POST, PATCH | ✅ |
| `/api/kpis/snapshots` | GET | ✅ |
| `/api/kpis/fleet-summary` | GET | ✅ |
| `/api/petty-cash/accounts` | GET | ✅ |
| `/api/petty-cash/transactions` | GET | ✅ |
| `/api/petty-cash/batches` | POST, PATCH | ✅ |

---

## Builds de Producción — Verificados

| App | Comando | Estado | Fecha |
|-----|---------|--------|-------|
| API | `tsc --noEmit` | ✅ Sin errores | 2026-06-09 |
| Web | `next build` | ✅ Sin errores (8 rutas) | 2026-06-09 |

---

## Próximo paso — Plan 5: Deploy EasyPanel

Ver: `docs/superpowers/plans/2026-06-09-plan-5-easypanel.md`

**Lo que se puede hacer HOY en local:**
1. Arrancar API en modo producción local — ver Plan 5, Sección "Prueba local pre-deploy"
2. Revisar y completar `.env.production.example`

**Mañana en EasyPanel:**
1. Crear servicios (postgres, redis, minio, api, web)
2. Configurar env vars
3. Build desde GitHub
4. Migraciones + seed
5. Pruebas end-to-end en producción

---

## Variables de entorno

### Desarrollo (`.env` en `apps/api/`)

```env
DATABASE_URL=postgresql://flotaos:flotaos_pass@localhost:5432/flotaos_db?sslmode=disable
REDIS_DISABLED=true
MINIO_DISABLED=true
JWT_SECRET=flotaos_dev_secret_min_32_chars_ok
JWT_REFRESH_SECRET=flotaos_dev_refresh_secret_32_chars
NODE_ENV=development
API_PORT=3001
```

### Producción — ver `.env.production.example` en raíz del repo
