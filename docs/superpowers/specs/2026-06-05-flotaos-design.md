# FlotaOS — Design Spec
**Fecha:** 2026-06-05  
**Proyecto:** Sistema de Gestión de Flotas — YOFC Perú  
**MVP deadline:** 10 días hábiles (~30h, 1 dev part-time ~3h/día)

---

## 1. Contexto

FlotaOS es un sistema integral de gestión de flotas para YOFC Perú con:
- **App Técnico de Campo** (React Native, offline-first): registro de eventos de viaje, gastos, taller
- **Web Dashboard** (Next.js): KPIs gerenciales, caja chica regional, mantenimiento, GPS
- **API REST** (Node.js + Express): backend central con JWT auth, WebSocket, cron jobs
- **PostgreSQL** self-hosted en EasyPanel (servidor de oficina)

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| App Móvil | React Native + Expo + TypeScript |
| Offline DB | WatermelonDB (sobre SQLite) |
| Backend API | Node.js + Express + TypeScript |
| ORM | Prisma |
| Base de datos | PostgreSQL 15 (Docker en EasyPanel) |
| Auth | JWT (access 15min + refresh 7d) — reemplaza Supabase Auth |
| Tiempo real | Socket.io + Redis Adapter — reemplaza Supabase Realtime |
| File storage | MinIO (Docker en EasyPanel) — reemplaza Supabase Storage |
| Background jobs | BullMQ + Redis — reemplaza node-cron y Supabase Edge Functions |
| Message broker | Redis 7 (Docker en EasyPanel) |
| Web Dashboard | Next.js 14 + TypeScript + Tailwind CSS |
| Gráficas | Recharts |
| Mapas | Mapbox GL JS |
| AI | Claude API |
| Monorepo | npm workspaces + Turborepo |
| Deploy | EasyPanel (Dockerfiles por app) — Blue/Green strategy |
| Git workflow | develop → main via MR obligatorio |

### Justificación de diferencias con estándar YOFC
*(Estándar es referencia, no obligatorio — ver `docs/stack-justification.md`)*

| Estándar YOFC | FlotaOS | Razón |
|---|---|---|
| Vue 3 + Pinia | Next.js 14 | Monorepo TypeScript compartido con React Native; SSR nativo |
| Django REST Framework | Node.js + Express | Tipos compartidos entre API/web/mobile en un solo lenguaje |
| Celery | BullMQ | Equivalente en Node.js sobre Redis — misma arquitectura de colas |
| Redis | Redis ✅ | Adoptado — BullMQ + Socket.io adapter |
| PostgreSQL 15 | PostgreSQL 15 ✅ | Igual |
| Docker + Compose | Docker + Compose ✅ | Igual |
| Web Dashboard | Next.js 14 + TypeScript + Tailwind CSS |
| Gráficas | Recharts |
| Mapas | Mapbox GL JS |
| AI | Claude API (mantenimiento predictivo + anomalías combustible) |
| Monorepo | npm workspaces + Turborepo |
| Deploy | EasyPanel (Dockerfiles por app) |

---

## 3. Estructura del Monorepo

```
flotaos/
├── apps/
│   ├── api/                    # Node.js + Express
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── middleware/     # JWT auth, scope filter, upload
│   │   │   ├── services/
│   │   │   ├── jobs/           # node-cron
│   │   │   └── websocket/      # Socket.io
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Schema completo 24+ tablas
│   │   │   └── migrations/
│   │   └── Dockerfile
│   ├── mobile/                 # React Native + Expo
│   │   ├── src/
│   │   │   ├── screens/
│   │   │   ├── components/
│   │   │   ├── db/             # WatermelonDB
│   │   │   ├── sync/           # Cola offline→API
│   │   │   └── api/            # Cliente REST
│   │   └── app.json
│   └── web/                    # Next.js 14
│       ├── src/
│       │   ├── app/            # App Router
│       │   ├── components/
│       │   └── lib/
│       └── Dockerfile
├── packages/
│   └── shared/                 # Tipos TypeScript compartidos
│       └── src/
│           ├── types.ts
│           └── enums.ts
├── docker-compose.yml          # PostgreSQL + MinIO (dev local)
├── package.json                # npm workspaces
└── turbo.json
```

---

## 4. Base de Datos

### Tabla adicional: users (reemplaza Supabase Auth)
```prisma
model User {
  id            String         @id @default(uuid())
  email         String         @unique
  password      String         // bcrypt hash
  role          Role
  staff         Staff?
  driver        Driver?
  refreshTokens RefreshToken[]
  createdAt     DateTime       @default(now())
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime
}
```

### Roles
```typescript
enum Role {
  driver | tecnico | supervisor | coordinador | asistente | director
}
```

### Tablas MVP activas (16)
users, vehicles, drivers, staff, regions, zones, teams, team_members, nodes,
trips, trip_events, ordenes_trabajo, petty_cash_transactions,
petty_cash_accounts, reimbursement_batches, kpi_snapshots, fleet_summaries

### Tablas post-MVP (schema creado, endpoints después)
gps_tracks, geofences, geofence_events, checklist_submissions,
catalogo_mantenimiento, plan_mantenimiento, maintenance_records,
spare_parts, fuel_records, fuel_anomalies, idle_records, fuel_cards,
driving_events, driver_scores, fatigue_records, driver_rewards,
fleet_documents, document_alerts, rental_contracts, maintenance_predictions,
alerts, staff_bank_accounts, providers, petty_cash_ledger

### event_type ENUM (trip_events) — ampliado para MVP
```
llegada_sitio | parada | reinicio | llegada_destino   ← original
ingreso_taller | salida_taller                         ← nuevo
```

---

## 5. Seguridad — Row Level Scoping

JWT payload incluye contexto completo:
```typescript
{
  userId, role,
  driverId?,    // solo drivers
  staffId?,     // técnicos, supervisores, coordinadores, asistentes
  teamId?,      // técnicos
  zoneId?,      // supervisores
  regionId?     // coordinadores, asistentes
}
```

Función central `scopeFilter(ctx, resource)`:
```typescript
switch (ctx.role) {
  case 'driver':      return { driverId: ctx.driverId }
  case 'tecnico':     return { team: { id: ctx.teamId } }
  case 'supervisor':  return { team: { zone: { id: ctx.zoneId } } }
  case 'coordinador':
  case 'asistente':   return { team: { zone: { regionId: ctx.regionId } } }
  case 'director':    return {}
}
```

---

## 6. API — Rutas MVP

### Auth
```
POST /auth/login         → { accessToken, refreshToken, user }
POST /auth/refresh       → { accessToken }
POST /auth/logout
```

### Core (requiere JWT)
```
GET  /api/vehicles                   scoped
GET  /api/vehicles/:id
GET  /api/teams
GET  /api/teams/:id/members
```

### Trips & Eventos de Campo
```
GET  /api/trips                      scoped por rol
POST /api/trips                      crear viaje del día
GET  /api/trips/:id
PATCH /api/trips/:id/status

POST /api/trips/:id/events           salida|parada|reinicio|llegada_destino|ingreso_taller|salida_taller
GET  /api/trips/:id/events
```

### Gastos de Campo
```
POST /api/expenses                   combustible|dg_refuel|peajes|viaticos|consumibles|otros
GET  /api/expenses                   scoped por rol
PATCH /api/expenses/:id/status
```

### Mantenimiento
```
GET  /api/maintenance/orders         scoped
POST /api/maintenance/orders         auto al ingreso_taller
PATCH /api/maintenance/orders/:id
```

### KPIs & Caja Chica
```
GET  /api/kpis/snapshots             scoped
GET  /api/kpis/fleet-summary
GET  /api/petty-cash/accounts        balance por región
GET  /api/petty-cash/transactions    scoped
POST /api/petty-cash/batches         crear lote reembolso
PATCH /api/petty-cash/batches/:id
```

### Uploads (MinIO)
```
POST /api/uploads/photo              → { url: signed_url_1h }
```

---

## 7. Flujos Críticos

### Parada con Fuerza Mayor
1. App sube 3 fotos → `POST /api/uploads/photo` × 3
2. App → `POST /api/trips/:id/events` con `is_force_majeure:true`, `fm_photos:[url1,url2,url3]`
3. API valida 3 fotos (400 si faltan)
4. Crea `trip_event`
5. Crea `alert { severity: 'critical', alert_type: 'fuerza_mayor' }`
6. Socket.io emite `alert:new` al supervisor de la zona

### Ingreso a Taller
1. App → `POST /api/trips/:id/events { event_type: 'ingreso_taller', diagnostico, km_entrada }`
2. API crea `trip_event`
3. API crea `ordenes_trabajo { status: 'en_taller' }`
4. Retorna `{ event, ordenTrabajo }`

### Salida de Taller
1. App → `POST /api/trips/:id/events { event_type: 'salida_taller', km_salida, trabajos_realizados }`
2. API crea `trip_event`
3. API cierra `ordenes_trabajo { status: 'completada', fecha_completada }`

### Gasto de Campo
1. App captura foto del comprobante
2. App sube foto → `POST /api/uploads/photo`
3. App → `POST /api/expenses` con URL foto
4. Sin foto → status queda `observado`
5. API auto-crea `fuel_record` si concept es `vehicle_fuel` o `dg_refuel`

### Sync Offline
1. App guarda en WatermelonDB local con `synced: false`
2. Cada 30s (o al reconectar): busca registros con `synced: false`
3. Sube en orden cronológico a la API
4. Marca `synced: true` al confirmar 201

---

## 8. App Móvil — Pantallas MVP

```
Stack de navegación:
LoginScreen
└── MainTabs
    ├── InicioScreen       viaje activo del día + acciones rápidas
    ├── EventosStack
    │   ├── SalidaScreen           GPS auto + foto opcional
    │   ├── ParadaScreen           motivo + toggle FM + 3 fotos si FM
    │   ├── FinActividadesScreen   GPS auto + km auto + foto
    │   ├── IngresoTallerScreen    diagnóstico + foto daño + km entrada
    │   └── SalidaTallerScreen     trabajos realizados + km salida
    ├── GastosStack
    │   ├── GastosListScreen       mis gastos del mes
    │   └── NuevoGastoScreen       tipo → monto → foto comprobante
    └── PerfilScreen
```

### WatermelonDB — Tablas locales
```javascript
trips:       { id, serverId, teamId, status, tripDate, synced }
tripEvents:  { id, serverId, tripId, eventType, latitude, longitude,
               isForceMajeure, fmType, fmPhotos, notes, synced, recordedAt }
expenses:    { id, serverId, tripId, concept, amount, photoUrl,
               status, synced, createdAt }
```

---

## 9. Web Dashboard — Páginas MVP

### /dashboard — KPIs Gerenciales
- 4 KPI cards: Costo/km, Km/L, Disponibilidad %, MTTR horas
- Gráfico barras: costo/km últimas 8 semanas (Recharts)
- Resumen ejecutivo: total km, combustible, mantenimiento

### /caja-chica — Caja Chica Regional
- Balance por región (4 barras proporcionales)
- Tabla transacciones filtrables por región/estado/fecha
- Totales: rendido vs pendiente vs observado

### /mantenimiento — Mantenimiento Preventivo (post-MVP día 1)
- Alertas proximidad Top 5 con semáforo (rojo/ámbar/verde)
- Leak Detector: preventivo vs correctivo por vehículo

### /gps — Dashboard GPS (post-MVP día 2)
- Mapa Mapbox con posición de vehículos activos
- Sidebar filtrable
- Socket.io para actualizaciones

---

## 10. Background Jobs (BullMQ + Redis)

```typescript
// apps/api/src/jobs/queues.ts
export const kpiQueue     = new Queue('kpi-snapshots',  { connection: redis })
export const alertQueue   = new Queue('doc-alerts',     { connection: redis })
export const summaryQueue = new Queue('fleet-summary',  { connection: redis })

// Schedules (BullMQ repeatable jobs)
await kpiQueue.add('daily-kpi',     {}, { repeat: { cron: '0 23 * * *' } })
await alertQueue.add('doc-alerts',  {}, { repeat: { cron: '0 0 * * *'  } })
await summaryQueue.add('weekly',    {}, { repeat: { cron: '0 6 * * 1'  } })

// Workers (procesadores)
// apps/api/src/jobs/workers/kpi.worker.ts    → calcularKPIsDelDia()
// apps/api/src/jobs/workers/alert.worker.ts  → generarAlertasVencimiento()
// apps/api/src/jobs/workers/summary.worker.ts → calcularFleetSummary()
```

**Ventajas sobre node-cron:**
- Jobs persisten en Redis — sobreviven reinicios de la API
- Reintentos automáticos con backoff exponencial
- Dashboard de monitoreo (Bull Board) incluido
- Mismo patrón que Celery del estándar YOFC

---

## 11. Plan de Desarrollo — 10 Días

| Día | Área | Entregable |
|-----|------|-----------|
| 1 | Setup | Monorepo + Docker + Prisma schema completo + npm workspaces |
| 2 | API | Auth JWT + CRUD vehicles/staff/teams/drivers/nodes |
| 3 | API | trips + events + FM validation + MinIO uploads + taller flow |
| 4 | API | expenses + KPI cron + Socket.io base + petty-cash endpoints |
| 5 | Mobile | Expo setup + WatermelonDB + auth + navegación base |
| 6 | Mobile | Formularios eventos campo (salida, parada/FM, fin, taller) |
| 7 | Mobile | Gastos de campo + sync queue offline→API |
| 8 | Web | Next.js setup + auth + layout + KPIs dashboard |
| 9 | Web | Caja chica regional + mantenimiento básico |
| 10 | Deploy | EasyPanel deploy + integración E2E + bug fixes |

**Post-MVP (semanas 3-4):**
- Dashboard GPS completo (Mapbox + Socket.io)
- Mantenimiento preventivo completo (catálogo + plan + alertas)
- Checklist pre-uso
- App Driver separada

---

## 12. Deploy en EasyPanel (Blue/Green Strategy)

```
Servicios Docker en EasyPanel:
├── flotaos-postgres    postgres:15-alpine    puerto 5432 (interno)
├── flotaos-redis       redis:7-alpine        puerto 6379 (interno)
├── flotaos-minio       minio/minio           puerto 9000/9001
├── flotaos-api         apps/api/Dockerfile   puerto 3001
└── flotaos-web         apps/web/Dockerfile   puerto 3000

Variables de entorno API (.env — nunca en git):
  DATABASE_URL=postgresql://...
  REDIS_URL=redis://flotaos-redis:6379
  JWT_SECRET=...
  JWT_REFRESH_SECRET=...
  MINIO_ENDPOINT=flotaos-minio:9000
  MINIO_ACCESS_KEY=...
  MINIO_SECRET_KEY=...
  CLAUDE_API_KEY=...
```

**Git Workflow (estándar YOFC adoptado):**
```
feature/* → develop    (MR con review)
develop   → main       (MR obligatorio — deploy a producción)
hotfix/*  → main       (MR urgente)
```

**Blue/Green en EasyPanel:**
```
Blue  = instancia activa (main)
Green = nueva versión (deploy en paralelo)
Swap  = EasyPanel redirige tráfico de Blue → Green sin downtime
Shared: PostgreSQL + Redis + MinIO persisten entre swaps
```

**Auto-deploy:**
GitHub webhook → push a main → EasyPanel rebuild → Blue/Green swap
