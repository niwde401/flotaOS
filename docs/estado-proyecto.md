# FlotaOS — Estado del Proyecto
**Última actualización:** 2026-06-08  
**Branch activo:** `develop`  
**Commits realizados:** 26

---

## Estado por Plan

| Plan | Archivo | Estado | Completado |
|------|---------|--------|-----------|
| Plan 1 — Infra & Monorepo | `plans/2026-06-05-plan-1-infra-setup.md` | ✅ COMPLETO | 2026-06-05 |
| Plan 2 — API REST | `plans/2026-06-05-plan-2-api.md` | ✅ COMPLETO | 2026-06-08 |
| Plan 3 — Mobile | `plans/2026-06-05-plan-3-mobile.md` | ✅ COMPLETO | 2026-06-08 |
| Plan 4 — Web Dashboard | `plans/2026-06-05-plan-4-web.md` | ✅ COMPLETO | 2026-06-08 |

---

## Entorno de Desarrollo — Configuración Local

### Restricciones del equipo
- **Sin permisos de administrador** — no se puede instalar software con instalador
- **Red corporativa** — bloquea algunos dominios externos (upstash.com, etc.)
- **Docker Desktop** — instalado (v4.76.0) pero **requiere WSL2** para funcionar → no disponible sin admin
- **WSL2** — no instalado, requiere admin

### Solución adoptada para dev local
| Servicio | Solución | Estado |
|----------|----------|--------|
| PostgreSQL 15 | **Portable** en `C:\Proyectos\postgresql15` | ✅ Corriendo |
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

Verificar que está corriendo:
```powershell
C:\Proyectos\postgresql15\pgsql\bin\pg_isready.exe -h localhost -p 5432
# Debe decir: localhost:5432 - aceptando conexiones
```

### 2. Arrancar la API

```powershell
cd C:\Proyectos\FlotaOS\apps\api
npx ts-node-dev --respawn src/index.ts
```

Logs esperados:
```
PostgreSQL connected
MinIO disabled (dev mode) — photo uploads skipped
Redis disabled (dev mode) — BullMQ jobs skipped
API running on port 3001
```

### 3. Verificar API funcionando

```powershell
# Health check
Invoke-RestMethod http://localhost:3001/health

# Login de prueba
$r = Invoke-RestMethod -Uri http://localhost:3001/auth/login -Method Post `
  -Body '{"email":"coord@yofc.pe","password":"Admin1234!"}' `
  -ContentType "application/json"
$r.data.user
```

---

## Usuarios de Prueba (seed)

| Email | Password | Rol |
|-------|----------|-----|
| `director@yofc.pe` | `Admin1234!` | director |
| `coord@yofc.pe` | `Admin1234!` | coordinador |
| `driver@yofc.pe` | `Admin1234!` | driver |

---

## Estructura del Proyecto

```
C:\Proyectos\FlotaOS\
├── apps/
│   ├── api/                    ← Express + Prisma (puerto 3001)
│   │   ├── src/
│   │   │   ├── middleware/     auth.ts, scopeFilter.ts, errorHandler.ts
│   │   │   ├── routes/         auth, vehicles, teams, trips, tripEvents
│   │   │   │                   + stubs: uploads, expenses, maintenance, kpis, pettyCash
│   │   │   ├── lib/            prisma.ts, redis.ts (disabled), minio.ts (disabled)
│   │   │   └── index.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma   28 tablas completas
│   │   │   ├── migrations/     20260605222840_init_complete_schema
│   │   │   └── seed.ts
│   │   └── .env                DATABASE_URL configurada, REDIS_DISABLED=true
│   ├── web/                    ← Next.js 14 (scaffolded, sin implementar)
│   └── mobile/                 ← Expo 56 (scaffolded, sin implementar)
├── packages/
│   └── shared/                 ← Tipos TypeScript compartidos (dist/ generado)
├── docs/
│   ├── estado-proyecto.md      ← ESTE ARCHIVO
│   ├── stack-justification.md
│   └── superpowers/
│       ├── specs/              2026-06-05-flotaos-design.md
│       └── plans/              plan-1 ✅, plan-2 ⏳, plan-3 ⏳, plan-4 ⏳
├── docker-compose.yml          (listo para producción/cuando haya Docker)
└── C:\Proyectos\postgresql15\  ← PostgreSQL portable (fuera del repo)
```

---

## Rutas API — Estado actual

| Ruta | Método | Estado |
|------|--------|--------|
| `/health` | GET | ✅ Funciona |
| `/auth/login` | POST | ✅ Funciona |
| `/auth/refresh` | POST | ✅ Funciona |
| `/auth/logout` | POST | ✅ Funciona |
| `/api/vehicles` | GET, POST, PATCH | ✅ Funciona |
| `/api/teams` | GET | ✅ Funciona |
| `/api/teams/:id/members` | GET | ✅ Funciona |
| `/api/trips` | GET, POST | ✅ Funciona |
| `/api/trips/:id/status` | PATCH | ✅ Funciona |
| `/api/trips/:id/events` | GET, POST | ✅ Funciona (con FM + taller) |
| `/api/uploads/photo` | POST | ✅ Funciona (MinIO requerido) |
| `/api/expenses` | GET, POST, PATCH | ✅ Funciona |
| `/api/maintenance/orders` | GET, POST, PATCH | ✅ Funciona |
| `/api/kpis/snapshots` | GET | ✅ Funciona |
| `/api/kpis/fleet-summary` | GET | ✅ Funciona |
| `/api/petty-cash/accounts` | GET | ✅ Funciona |
| `/api/petty-cash/transactions` | GET | ✅ Funciona |
| `/api/petty-cash/batches` | POST, PATCH | ✅ Funciona |

---

## Próximos pasos

1. **Abrir terminal** en `C:\Proyectos\FlotaOS`
2. **Arrancar PostgreSQL** con el comando de arriba
3. **Ejecutar Plan 3** (mobile):
   > "ejecuta el plan 3 con un agente"
4. **Ejecutar Plan 4** (web dashboard) — puede correr en paralelo con Plan 3

---

## Variables de entorno (.env) — Resumen

```env
DATABASE_URL=postgresql://flotaos:flotaos_pass@localhost:5432/flotaos_db?sslmode=disable
REDIS_DISABLED=true
MINIO_DISABLED=true
JWT_SECRET=flotaos_dev_secret_min_32_chars_ok
JWT_REFRESH_SECRET=flotaos_dev_refresh_secret_32_chars
NODE_ENV=development
API_PORT=3001
```
