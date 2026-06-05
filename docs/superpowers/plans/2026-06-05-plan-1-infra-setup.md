# FlotaOS — Plan 1: Infrastructure & Monorepo Setup

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the complete FlotaOS monorepo with npm workspaces, Turborepo, shared types, Prisma schema (24+ tables), and Docker infrastructure (PostgreSQL 15, Redis 7, MinIO).

**Architecture:** npm workspaces monorepo with `apps/api`, `apps/web`, `apps/mobile`, and `packages/shared`. Docker Compose handles local infrastructure. Prisma schema created in full on Day 1 even though only MVP tables get endpoints — avoids disruptive migrations later.

**Tech Stack:** npm workspaces, Turborepo, TypeScript, Prisma 5, PostgreSQL 15, Redis 7, MinIO, Docker Compose

**Dependency:** None — this plan runs first. Plans 2, 3, 4 depend on this being complete.

---

### Task 1: Init Monorepo Root

**Files:**
- Create: `flotaos/package.json`
- Create: `flotaos/turbo.json`
- Create: `flotaos/.gitignore`
- Create: `flotaos/.env.example`

- [ ] **Step 1: Create root directory and package.json**

```bash
mkdir flotaos && cd flotaos
```

Create `package.json`:
```json
{
  "name": "flotaos",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {}
  }
}
```

- [ ] **Step 3: Create .gitignore**

```
node_modules/
dist/
.next/
.expo/
*.env
.env.local
.env.production
.superpowers/
```

- [ ] **Step 4: Create .env.example**

```bash
# PostgreSQL
DATABASE_URL=postgresql://flotaos:flotaos_pass@localhost:5432/flotaos_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=change_me_in_production_min_32_chars
JWT_REFRESH_SECRET=change_me_refresh_min_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=flotaos_minio
MINIO_SECRET_KEY=flotaos_minio_secret
MINIO_BUCKET=fleet-docs

# Claude API
CLAUDE_API_KEY=

# App
NODE_ENV=development
API_PORT=3001
```

- [ ] **Step 5: Install root dependencies**

```bash
npm install
```

Expected: `node_modules/` created, `package-lock.json` generated.

- [ ] **Step 6: Commit**

```bash
git init
git checkout -b develop
git add .
git commit -m "feat: init monorepo with npm workspaces and turborepo"
```

---

### Task 2: packages/shared — Shared TypeScript Types

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/enums.ts`
- Create: `packages/shared/src/types.ts`
- Create: `packages/shared/src/index.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@flotaos/shared",
  "version": "0.0.1",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "esModuleInterop": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create src/enums.ts**

```typescript
export enum Role {
  driver = 'driver',
  tecnico = 'tecnico',
  supervisor = 'supervisor',
  coordinador = 'coordinador',
  asistente = 'asistente',
  director = 'director',
}

export enum VehicleStatus {
  active = 'active',
  inactive = 'inactive',
  in_maintenance = 'in_maintenance',
  out_of_service = 'out_of_service',
}

export enum TripStatus {
  scheduled = 'scheduled',
  active = 'active',
  completed = 'completed',
  cancelled = 'cancelled',
}

export enum EventType {
  llegada_sitio = 'llegada_sitio',
  parada = 'parada',
  reinicio = 'reinicio',
  llegada_destino = 'llegada_destino',
  ingreso_taller = 'ingreso_taller',
  salida_taller = 'salida_taller',
}

export enum ForceMajeureType {
  derrumbe = 'derrumbe',
  inundacion = 'inundacion',
  caida_puente = 'caida_puente',
  lluvias = 'lluvias',
  contingencia_social = 'contingencia_social',
  otros = 'otros',
}

export enum ConceptType {
  vehicle_fuel = 'vehicle_fuel',
  dg_refuel = 'dg_refuel',
  peajes = 'peajes',
  viaticos = 'viaticos',
  consumibles = 'consumibles',
  vehicle_expenses = 'vehicle_expenses',
  operation_expense = 'operation_expense',
  boat_expense = 'boat_expense',
  otros = 'otros',
}

export enum TransactionStatus {
  rendido = 'rendido',
  pendiente = 'pendiente',
  pendiente_carga_f = 'pendiente_carga_f',
  en_reembolso = 'en_reembolso',
  inhouse = 'inhouse',
  expense_record = 'expense_record',
  observado = 'observado',
  depositado = 'depositado',
}

export enum OTStatus {
  pending = 'pending',
  en_taller = 'en_taller',
  completada = 'completada',
  cancelled = 'cancelled',
}

export enum AlertSeverity {
  low = 'low',
  med = 'med',
  high = 'high',
  critical = 'critical',
}
```

- [ ] **Step 4: Create src/types.ts**

```typescript
import { Role, VehicleStatus, TripStatus, EventType, ForceMajeureType, ConceptType, TransactionStatus, OTStatus, AlertSeverity } from './enums'

// ─── Auth ─────────────────────────────────────────────────────────────────

export interface UserContext {
  userId: string
  role: Role
  driverId?: string
  staffId?: string
  teamId?: string
  zoneId?: string
  regionId?: string
}

export interface LoginDTO {
  email: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    role: Role
    fullName: string
  }
}

// ─── Vehicles ─────────────────────────────────────────────────────────────

export interface VehicleDTO {
  id: string
  plateNumber: string
  brand: string
  model: string
  year: number
  vehicleType: 'own' | 'rented'
  status: VehicleStatus
  fuelType: string
  currentKm: number
}

// ─── Trips ────────────────────────────────────────────────────────────────

export interface CreateTripDTO {
  teamId: string
  vehicleId: string
  driverId: string
  origin: string
  destination: string
  nodeCode?: string
  tripDate: string // ISO date
}

export interface TripDTO {
  id: string
  teamId: string
  vehicleId: string
  driverId: string
  origin: string
  destination: string
  status: TripStatus
  tripDate: string
  startedAt?: string
  completedAt?: string
}

// ─── Events ───────────────────────────────────────────────────────────────

export interface CreateEventDTO {
  eventType: EventType
  latitude: number
  longitude: number
  notes?: string
  photoUrl?: string
  isForceMajeure?: boolean
  fmType?: ForceMajeureType
  fmPhotos?: string[]    // exactly 3 URLs when isForceMajeure=true
  diagnostico?: string   // for ingreso_taller
  kmEntrada?: number     // for ingreso_taller
  kmSalida?: number      // for salida_taller
  trabajosRealizados?: string // for salida_taller
}

export interface TripEventDTO {
  id: string
  tripId: string
  eventType: EventType
  latitude: number
  longitude: number
  isForceMajeure: boolean
  fmType?: ForceMajeureType
  recordedAt: string
}

// ─── Expenses ─────────────────────────────────────────────────────────────

export interface CreateExpenseDTO {
  tripId?: string
  concept: ConceptType
  description?: string
  nodeCode?: string
  vehiclePlate?: string
  amount: number
  voucherType?: string
  voucherNumber?: string
  photoUrl?: string     // comprobante — if missing, status=observado
}

export interface ExpenseDTO {
  id: string
  concept: ConceptType
  amount: number
  status: TransactionStatus
  photoUrl?: string
  transactionDate: string
}

// ─── KPIs ─────────────────────────────────────────────────────────────────

export interface KpiSummaryDTO {
  costPerKm: number
  kmPerLiter: number
  mechanicalAvailability: number
  mttrHours: number
  speedingEvents: number
  period: string
}

// ─── Petty Cash ───────────────────────────────────────────────────────────

export interface PettyCashAccountDTO {
  regionId: string
  regionName: string
  permanentFund: number
  currentBalance: number
  amountInField: number
  toBeSubmitted: number
  inReimbursement: number
  gap: number
}

// ─── API Response ─────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
  meta?: {
    total: number
    page: number
    pageSize: number
  }
}
```

- [ ] **Step 5: Create src/index.ts**

```typescript
export * from './enums'
export * from './types'
```

- [ ] **Step 6: Build shared package**

```bash
cd packages/shared && npm run build
```

Expected: `packages/shared/dist/` created with `index.js`, `index.d.ts`.

- [ ] **Step 7: Commit**

```bash
cd ../..
git add packages/
git commit -m "feat: add shared types and enums package"
```

---

### Task 3: Docker Compose Infrastructure

**Files:**
- Create: `docker-compose.yml`
- Create: `docker-compose.prod.yml`

- [ ] **Step 1: Create docker-compose.yml (development)**

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    container_name: flotaos-postgres
    environment:
      POSTGRES_USER: flotaos
      POSTGRES_PASSWORD: flotaos_pass
      POSTGRES_DB: flotaos_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U flotaos"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: flotaos-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  minio:
    image: minio/minio
    container_name: flotaos-minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: flotaos_minio
      MINIO_ROOT_PASSWORD: flotaos_minio_secret
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 10s
      timeout: 5s
      retries: 3

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

- [ ] **Step 2: Start infrastructure and verify**

```bash
cp .env.example .env
docker compose up -d
docker compose ps
```

Expected output:
```
NAME                STATUS
flotaos-postgres    Up (healthy)
flotaos-redis       Up (healthy)
flotaos-minio       Up (healthy)
```

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml .env.example
git commit -m "feat: add docker compose for postgres, redis, minio"
```

---

### Task 4: apps/api — Express + Prisma Scaffold

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/index.ts`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/lib/prisma.ts`
- Create: `apps/api/src/lib/redis.ts`
- Create: `apps/api/src/lib/minio.ts`

- [ ] **Step 1: Create apps/api/package.json**

```json
{
  "name": "@flotaos/api",
  "version": "0.0.1",
  "scripts": {
    "dev": "ts-node-dev --respawn src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.24.0",
    "@flotaos/shared": "*",
    "@prisma/client": "^5.14.0",
    "bcryptjs": "^2.4.3",
    "bullmq": "^5.7.0",
    "cors": "^2.8.5",
    "express": "^4.19.0",
    "ioredis": "^5.3.2",
    "jsonwebtoken": "^9.0.2",
    "minio": "^7.1.3",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1",
    "socket.io": "^4.7.5",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/morgan": "^1.9.9",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.0.0",
    "jest": "^29.7.0",
    "prisma": "^5.14.0",
    "ts-jest": "^29.1.4",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create apps/api/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create apps/api/src/lib/prisma.ts**

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 4: Create apps/api/src/lib/redis.ts**

```typescript
import { Redis } from 'ioredis'

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

redis.on('error', (err) => console.error('Redis error:', err))
redis.on('connect', () => console.log('Redis connected'))
```

- [ ] **Step 5: Create apps/api/src/lib/minio.ts**

```typescript
import { Client } from 'minio'

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'flotaos_minio',
  secretKey: process.env.MINIO_SECRET_KEY || 'flotaos_minio_secret',
})

export const BUCKET = process.env.MINIO_BUCKET || 'fleet-docs'

export async function ensureBucket(): Promise<void> {
  const exists = await minioClient.bucketExists(BUCKET)
  if (!exists) {
    await minioClient.makeBucket(BUCKET)
    await minioClient.setBucketPolicy(BUCKET, JSON.stringify({
      Version: '2012-10-17',
      Statement: [{
        Effect: 'Deny',
        Principal: '*',
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${BUCKET}/*`],
      }],
    }))
    console.log(`MinIO bucket '${BUCKET}' created`)
  }
}

export async function getSignedUrl(objectName: string, expiry = 3600): Promise<string> {
  return minioClient.presignedGetObject(BUCKET, objectName, expiry)
}
```

- [ ] **Step 6: Create apps/api/src/app.ts**

```typescript
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'

export function createApp() {
  const app = express()

  app.use(cors({ origin: process.env.WEB_URL || 'http://localhost:3000', credentials: true }))
  app.use(express.json({ limit: '10mb' }))
  app.use(morgan('dev'))

  app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }))

  return app
}
```

- [ ] **Step 7: Create apps/api/src/index.ts**

```typescript
import 'dotenv/config'
import http from 'http'
import { Server } from 'socket.io'
import { createApp } from './app'
import { prisma } from './lib/prisma'
import { ensureBucket } from './lib/minio'

const PORT = parseInt(process.env.API_PORT || '3001')

async function main() {
  await prisma.$connect()
  console.log('PostgreSQL connected')

  await ensureBucket()

  const app = createApp()
  const httpServer = http.createServer(app)

  const io = new Server(httpServer, {
    cors: { origin: process.env.WEB_URL || 'http://localhost:3000', credentials: true },
  })

  io.on('connection', (socket) => {
    console.log('WS client connected:', socket.id)
    socket.on('join:zone', (zoneId: string) => socket.join(`zone:${zoneId}`))
    socket.on('join:region', (regionId: string) => socket.join(`region:${regionId}`))
  })

  // Attach io to app for use in routes
  app.set('io', io)

  httpServer.listen(PORT, () => console.log(`API running on port ${PORT}`))
}

main().catch((err) => { console.error(err); process.exit(1) })
```

- [ ] **Step 8: Install API dependencies**

```bash
cd apps/api && npm install
```

- [ ] **Step 9: Commit**

```bash
cd ../..
git add apps/api/
git commit -m "feat: scaffold api app with express, prisma, redis, minio, socket.io"
```

---

### Task 5: Prisma Schema — All 24+ Tables

**Files:**
- Create: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Init Prisma**

```bash
cd apps/api
npx prisma init --datasource-provider postgresql
```

Expected: `prisma/schema.prisma` created.

- [ ] **Step 2: Replace schema.prisma with complete schema**

Write the full content to `apps/api/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  driver
  tecnico
  supervisor
  coordinador
  asistente
  director
}

enum VehicleType { own rented }
enum VehicleStatus { active inactive in_maintenance out_of_service }
enum FuelType { gasoline diesel hybrid }
enum TripStatus { scheduled active completed cancelled }
enum EventType { llegada_sitio parada reinicio llegada_destino ingreso_taller salida_taller }
enum ForceMajeureType { derrumbe inundacion caida_puente lluvias contingencia_social otros }
enum TaskType { instalacion mantenimiento_preventivo mantenimiento_correctivo carga_generador inspeccion otro }
enum TaskStatus { pending in_progress completed cancelled }
enum Priority { low med high }
enum ConceptType { vehicle_fuel dg_refuel peajes viaticos consumibles vehicle_expenses operation_expense boat_expense otros }
enum TransactionStatus { rendido pendiente pendiente_carga_f en_reembolso inhouse expense_record observado depositado }
enum VoucherType { factura boleta recibo otro }
enum ReimbursementType { bank_transfer cash other }
enum BatchType { weekly monthly special }
enum BatchStatus { draft submitted approved paid }
enum MaintenanceUnit { km horas meses }
enum ServiceType { preventive corrective emergency }
enum OTStatus { pending en_taller completada cancelled }
enum OTUrgency { normal urgent critical }
enum NodeType { site node hub depot }
enum DocumentType { soat technical_revision circulation_permit insurance rental_contract driver_license medical_cert others }
enum AlertSeverity { low med high critical }
enum AlertType { geocerca_entrada geocerca_salida exceso_velocidad ralenti_prolongado zona_restringida bateria_baja sin_senal fuerza_mayor doc_vencimiento mantenimiento_vencido }
enum RewardType { mejor_conductor_semana mejor_km_l cero_eventos_mes puntualidad reconocimiento_especial }
enum PeriodType { daily weekly monthly }
enum RiskLevel { low med high critical }
enum AnomalyType { consumo_excesivo perdida_combustible carga_no_registrada rendimiento_bajo }

model User {
  id            String         @id @default(uuid())
  email         String         @unique
  password      String
  role          Role
  isActive      Boolean        @default(true)
  staff         Staff?
  driver        Driver?
  refreshTokens RefreshToken[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  @@map("users")
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
  @@map("refresh_tokens")
}

model Region {
  id            String   @id @default(uuid())
  name          String   @db.VarChar(100)
  code          String   @unique @db.VarChar(10)
  coordinatorId String?
  colorHex      String   @db.VarChar(6)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  zones                 Zone[]
  teams                 Team[]
  staff                 Staff[]
  nodes                 Node[]
  pettyCashTransactions PettyCashTransaction[]
  pettyCashAccounts     PettyCashAccount[]
  reimbursementBatches  ReimbursementBatch[]
  fleetSummaries        FleetSummary[]
  pettyCashLedger       PettyCashLedger[]
  @@map("regions")
}

model Zone {
  id           String   @id @default(uuid())
  name         String   @db.VarChar(100)
  regionId     String
  region       Region   @relation(fields: [regionId], references: [id])
  supervisorId String?
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  teams Team[]
  nodes Node[]
  @@map("zones")
}

model Provider {
  id           String   @id @default(uuid())
  companyName  String   @db.VarChar(200)
  ruc          String   @unique @db.VarChar(11)
  contactName  String   @db.VarChar(100)
  contactPhone String   @db.VarChar(20)
  contactEmail String   @db.VarChar(100)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  vehicles        Vehicle[]
  rentalContracts RentalContract[]
  fleetDocuments  FleetDocument[]
  @@map("providers")
}

model Vehicle {
  id              String        @id @default(uuid())
  plateNumber     String        @unique @db.VarChar(8)
  brand           String        @db.VarChar(50)
  model           String        @db.VarChar(100)
  year            Int
  vehicleType     VehicleType
  status          VehicleStatus @default(active)
  fuelType        FuelType
  currentKm       Int           @default(0)
  horometroActual Int           @default(0)
  providerId      String?
  provider        Provider?     @relation(fields: [providerId], references: [id])
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  drivers                Driver[]
  teams                  Team[]
  gpsTracks              GpsTrack[]
  trips                  Trip[]
  tripEvents             TripEvent[]
  maintenanceRecords     MaintenanceRecord[]
  planMantenimiento      PlanMantenimiento[]
  ordenesTrabajoList     OrdenesTrabajo[]
  fuelRecords            FuelRecord[]
  fuelAnomalies          FuelAnomaly[]
  idleRecords            IdleRecord[]
  kpiSnapshots           KpiSnapshot[]
  fleetDocuments         FleetDocument[]
  rentalContracts        RentalContract[]
  alerts                 Alert[]
  maintenancePredictions MaintenancePrediction[]
  alertasMantenimiento   AlertaMantenimiento[]
  checklistSubmissions   ChecklistSubmission[]
  drivingEvents          DrivingEvent[]
  @@map("vehicles")
}

model Driver {
  id                String   @id @default(uuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id])
  fullName          String   @db.VarChar(200)
  dni               String   @unique @db.VarChar(8)
  licenseNumber     String   @db.VarChar(20)
  licenseExpiry     DateTime @db.Date
  licenseCategory   String   @db.VarChar(5)
  medicalCertExpiry DateTime @db.Date
  score             Int      @default(100)
  assignedVehicleId String?
  assignedVehicle   Vehicle? @relation(fields: [assignedVehicleId], references: [id])
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  trips            Trip[]
  tripEvents       TripEvent[]
  fuelRecords      FuelRecord[]
  drivingEvents    DrivingEvent[]
  driverScores     DriverScore[]
  fatigueRecords   FatigueRecord[]
  driverRewards    DriverReward[]
  fleetDocuments   FleetDocument[]
  alerts           Alert[]
  @@map("drivers")
}

model Staff {
  id        String   @id @default(uuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])
  fullName  String   @db.VarChar(200)
  email     String   @db.VarChar(100)
  regionId  String
  region    Region   @relation(fields: [regionId], references: [id])
  role      Role
  teamId    String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  teamMemberships       TeamMember[]
  tasks                 Task[]
  taskEvents            TaskEvent[]
  pettyCashTransactions PettyCashTransaction[]
  reimbursementBatches  ReimbursementBatch[]
  staffBankAccounts     StaffBankAccount[]
  pettyCashLedger       PettyCashLedger[]
  @@map("staff")
}

model Team {
  id           String   @id @default(uuid())
  name         String   @db.VarChar(100)
  regionId     String
  region       Region   @relation(fields: [regionId], references: [id])
  zoneId       String
  zone         Zone     @relation(fields: [zoneId], references: [id])
  vehicleId    String?
  vehicle      Vehicle? @relation(fields: [vehicleId], references: [id])
  supervisorId String?
  tripDate     DateTime @db.Date
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  members TeamMember[]
  tasks   Task[]
  trips   Trip[]
  alerts  Alert[]
  @@map("teams")
}

model TeamMember {
  id           String    @id @default(uuid())
  teamId       String
  team         Team      @relation(fields: [teamId], references: [id])
  staffId      String
  staff        Staff     @relation(fields: [staffId], references: [id])
  role         Role
  subgroup     Int
  nodeAssigned String?   @db.VarChar(50)
  joinedAt     DateTime  @default(now())
  leftAt       DateTime?
  @@map("team_members")
}

model Node {
  id           String   @id @default(uuid())
  code         String   @unique @db.VarChar(50)
  name         String   @db.VarChar(200)
  regionId     String
  region       Region   @relation(fields: [regionId], references: [id])
  zoneId       String
  zone         Zone     @relation(fields: [zoneId], references: [id])
  latitude     Decimal  @db.Decimal(10, 7)
  longitude    Decimal  @db.Decimal(10, 7)
  nodeType     NodeType
  hasGenerator Boolean  @default(false)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  tasks Task[]
  @@map("nodes")
}

model GpsTrack {
  id         BigInt   @id @default(autoincrement())
  vehicleId  String
  vehicle    Vehicle  @relation(fields: [vehicleId], references: [id])
  latitude   Decimal  @db.Decimal(10, 7)
  longitude  Decimal  @db.Decimal(10, 7)
  speed      Int
  heading    Int
  altitude   Int
  engineOn   Boolean
  recordedAt DateTime
  @@index([vehicleId, recordedAt(sort: Desc)])
  @@map("gps_tracks")
}

model Geofence {
  id           String   @id @default(uuid())
  name         String   @db.VarChar(100)
  coordinates  Json
  alertOnEntry Boolean  @default(true)
  alertOnExit  Boolean  @default(true)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  geofenceEvents GeofenceEvent[]
  @@map("geofences")
}

model GeofenceEvent {
  id         String   @id @default(uuid())
  vehicleId  String
  vehicle    Vehicle  @relation(fields: [vehicleId], references: [id])
  geofenceId String
  geofence   Geofence @relation(fields: [geofenceId], references: [id])
  eventType  String   @db.VarChar(10)
  latitude   Decimal  @db.Decimal(10, 7)
  longitude  Decimal  @db.Decimal(10, 7)
  occurredAt DateTime
  isResolved Boolean  @default(false)
  @@map("geofence_events")
}

model Trip {
  id          String     @id @default(uuid())
  teamId      String
  team        Team       @relation(fields: [teamId], references: [id])
  vehicleId   String
  vehicle     Vehicle    @relation(fields: [vehicleId], references: [id])
  driverId    String
  driver      Driver     @relation(fields: [driverId], references: [id])
  origin      String     @db.VarChar(200)
  destination String     @db.VarChar(200)
  nodeCode    String?    @db.VarChar(50)
  tripDate    DateTime   @db.Date
  status      TripStatus @default(scheduled)
  startedAt   DateTime?
  completedAt DateTime?
  totalKm     Decimal?   @db.Decimal(8, 2)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  events                TripEvent[]
  fuelRecords           FuelRecord[]
  pettyCashTransactions PettyCashTransaction[]
  checklistSubmissions  ChecklistSubmission[]
  @@map("trips")
}

model TripEvent {
  id             String            @id @default(uuid())
  vehicleId      String
  vehicle        Vehicle           @relation(fields: [vehicleId], references: [id])
  driverId       String
  driver         Driver            @relation(fields: [driverId], references: [id])
  tripId         String
  trip           Trip              @relation(fields: [tripId], references: [id])
  eventType      EventType
  latitude       Decimal           @db.Decimal(10, 7)
  longitude      Decimal           @db.Decimal(10, 7)
  photoUrl       String?           @db.VarChar(500)
  notes          String?
  isForceMajeure Boolean           @default(false)
  fmType         ForceMajeureType?
  fmPhotos       Json?
  diagnostico    String?
  kmEntrada      Int?
  kmSalida       Int?
  recordedAt     DateTime          @default(now())
  ordenesTrabajo OrdenesTrabajo[]
  @@map("trip_events")
}

model ChecklistSubmission {
  id             String   @id @default(uuid())
  vehicleId      String
  vehicle        Vehicle  @relation(fields: [vehicleId], references: [id])
  driverId       String
  driver         Driver   @relation(fields: [driverId], references: [id])
  tripId         String
  trip           Trip     @relation(fields: [tripId], references: [id])
  itemsJson      Json
  hasIssues      Boolean  @default(false)
  vehicleBlocked Boolean  @default(false)
  submittedAt    DateTime @default(now())
  @@map("checklist_submissions")
}

model CatalogoMantenimiento {
  id               String          @id @default(uuid())
  nombreElemento   String          @db.VarChar(100)
  unidadMedida     MaintenanceUnit
  descripcion      String?
  procedimientoSop String?
  isActive         Boolean         @default(true)
  createdAt        DateTime        @default(now())
  planMantenimiento  PlanMantenimiento[]
  maintenanceRecords MaintenanceRecord[]
  @@map("catalogo_mantenimiento")
}

model PlanMantenimiento {
  id               String                @id @default(uuid())
  vehiculoId       String
  vehiculo         Vehicle               @relation(fields: [vehiculoId], references: [id])
  elementoId       String
  elemento         CatalogoMantenimiento @relation(fields: [elementoId], references: [id])
  frecuenciaValor  Int
  frecuenciaUnidad MaintenanceUnit
  alertaAmarilla   Int
  alertaRoja       Int
  isActive         Boolean               @default(true)
  createdAt        DateTime              @default(now())
  alertasMantenimiento AlertaMantenimiento[]
  @@map("plan_mantenimiento")
}

model MaintenanceRecord {
  id               String                @id @default(uuid())
  vehiculoId       String
  vehiculo         Vehicle               @relation(fields: [vehiculoId], references: [id])
  elementoId       String
  elemento         CatalogoMantenimiento @relation(fields: [elementoId], references: [id])
  ordenTrabajoId   String?
  ordenTrabajo     OrdenesTrabajo?       @relation(fields: [ordenTrabajoId], references: [id])
  fechaServicio    DateTime              @db.Date
  lecturaOdometro  Int
  lecturaHorometro Int
  costoRepuestos   Decimal               @db.Decimal(10, 2)
  costoManoObra    Decimal               @db.Decimal(10, 2)
  costoTotal       Decimal               @db.Decimal(10, 2)
  tallerProveedor  String?               @db.VarChar(100)
  tipoServicio     ServiceType
  observaciones    String?
  createdAt        DateTime              @default(now())
  @@map("maintenance_records")
}

model OrdenesTrabajo {
  id              String     @id @default(uuid())
  vehiculoId      String
  vehiculo        Vehicle    @relation(fields: [vehiculoId], references: [id])
  tripEventId     String?
  tripEvent       TripEvent? @relation(fields: [tripEventId], references: [id])
  numeroOt        String     @unique @db.VarChar(20)
  fechaProgramada DateTime   @db.Date
  fechaCompletada DateTime?  @db.Date
  status          OTStatus   @default(pending)
  urgencia        OTUrgency  @default(normal)
  taller          String?    @db.VarChar(100)
  costoEstimado   Decimal?   @db.Decimal(10, 2)
  costoReal       Decimal?   @db.Decimal(10, 2)
  trabajos        Json?
  repuestos       Json?
  generadoPor     String?
  diagnostico     String?
  kmEntrada       Int?
  kmSalida        Int?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  maintenanceRecords MaintenanceRecord[]
  @@map("ordenes_trabajo")
}

model SparePart {
  id         String   @id @default(uuid())
  partNumber String   @db.VarChar(50)
  name       String   @db.VarChar(200)
  stockQty   Int      @default(0)
  minStock   Int      @default(0)
  unitCost   Decimal  @db.Decimal(8, 2)
  supplier   String?  @db.VarChar(100)
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  @@map("spare_parts")
}

model MaintenancePrediction {
  id              String    @id @default(uuid())
  vehiculoId      String
  vehiculo        Vehicle   @relation(fields: [vehiculoId], references: [id])
  componente      String    @db.VarChar(100)
  nivelRiesgo     RiskLevel
  kmEstimadoFalla Int
  costoPreventivo Decimal   @db.Decimal(10, 2)
  costoCorrectivo Decimal   @db.Decimal(10, 2)
  resumenIa       String?
  analizadoAt     DateTime  @default(now())
  @@map("maintenance_predictions")
}

model AlertaMantenimiento {
  id                  String            @id @default(uuid())
  vehiculoId          String
  vehiculo            Vehicle           @relation(fields: [vehiculoId], references: [id])
  planId              String
  plan                PlanMantenimiento @relation(fields: [planId], references: [id])
  tipoAlerta          String            @db.VarChar(50)
  urgencia            OTUrgency
  kmVencimiento       Int?
  fechaVencimiento    DateTime?         @db.Date
  notificacionEnviada Boolean           @default(false)
  isResolved          Boolean           @default(false)
  createdAt           DateTime          @default(now())
  @@map("alertas_mantenimiento")
}

model FuelRecord {
  id           String   @id @default(uuid())
  vehicleId    String
  vehicle      Vehicle  @relation(fields: [vehicleId], references: [id])
  driverId     String
  driver       Driver   @relation(fields: [driverId], references: [id])
  tripId       String?
  trip         Trip?    @relation(fields: [tripId], references: [id])
  liters       Decimal  @db.Decimal(6, 2)
  totalCost    Decimal  @db.Decimal(8, 2)
  kmAtRefuel   Int
  fuelCardId   String?  @db.VarChar(20)
  stationName  String?  @db.VarChar(100)
  receiptPhoto String?  @db.VarChar(500)
  isAnomaly    Boolean  @default(false)
  anomalyType  String?  @db.VarChar(30)
  recordedAt   DateTime @default(now())
  @@map("fuel_records")
}

model FuelAnomaly {
  id            String        @id @default(uuid())
  vehicleId     String
  vehicle       Vehicle       @relation(fields: [vehicleId], references: [id])
  driverId      String
  driver        Driver        @relation(fields: [driverId], references: [id])
  anomalyType   AnomalyType
  description   String?
  severity      AlertSeverity
  estimatedLoss Decimal?      @db.Decimal(8, 2)
  claudeAnalysis String?
  isResolved    Boolean       @default(false)
  detectedAt    DateTime      @default(now())
  @@map("fuel_anomalies")
}

model IdleRecord {
  id              String   @id @default(uuid())
  vehicleId       String
  vehicle         Vehicle  @relation(fields: [vehicleId], references: [id])
  driverId        String
  driver          Driver   @relation(fields: [driverId], references: [id])
  durationMinutes Int
  litersWasted    Decimal  @db.Decimal(6, 2)
  costWasted      Decimal  @db.Decimal(8, 2)
  latitude        Decimal  @db.Decimal(10, 7)
  longitude       Decimal  @db.Decimal(10, 7)
  startedAt       DateTime
  endedAt         DateTime
  @@map("idle_records")
}

model FuelCard {
  id         String  @id @default(uuid())
  cardNumber String  @unique @db.VarChar(20)
  vehicleId  String?
  isActive   Boolean @default(true)
  @@map("fuel_cards")
}

model DrivingEvent {
  id         String        @id @default(uuid())
  driverId   String
  driver     Driver        @relation(fields: [driverId], references: [id])
  vehicleId  String
  vehicle    Vehicle       @relation(fields: [vehicleId], references: [id])
  eventType  String        @db.VarChar(50)
  severity   AlertSeverity
  speed      Int
  latitude   Decimal       @db.Decimal(10, 7)
  longitude  Decimal       @db.Decimal(10, 7)
  recordedAt DateTime      @default(now())
  @@map("driving_events")
}

model DriverScore {
  id                String   @id @default(uuid())
  driverId          String
  driver            Driver   @relation(fields: [driverId], references: [id])
  scoreDate         DateTime @db.Date
  totalScore        Int
  harshBrakingCount Int      @default(0)
  harshAccelCount   Int      @default(0)
  speedingCount     Int      @default(0)
  idleMinutes       Int      @default(0)
  kmPerLiter        Decimal  @db.Decimal(6, 3)
  createdAt         DateTime @default(now())
  @@map("driver_scores")
}

model FatigueRecord {
  id           String   @id @default(uuid())
  driverId     String
  driver       Driver   @relation(fields: [driverId], references: [id])
  workDate     DateTime @db.Date
  hoursDriven  Decimal  @db.Decimal(4, 2)
  breaksTaken  Int      @default(0)
  limitReached Boolean  @default(false)
  lastBreakAt  DateTime?
  createdAt    DateTime @default(now())
  @@map("fatigue_records")
}

model DriverReward {
  id          String     @id @default(uuid())
  driverId    String
  driver      Driver     @relation(fields: [driverId], references: [id])
  rewardType  RewardType
  description String     @db.VarChar(200)
  awardedDate DateTime   @db.Date
  period      String     @db.VarChar(20)
  isClaimed   Boolean    @default(false)
  claimedAt   DateTime?
  createdAt   DateTime   @default(now())
  @@map("driver_rewards")
}

model FleetDocument {
  id              String       @id @default(uuid())
  vehicleId       String?
  vehicle         Vehicle?     @relation(fields: [vehicleId], references: [id])
  driverId        String?
  driver          Driver?      @relation(fields: [driverId], references: [id])
  providerId      String?
  provider        Provider?    @relation(fields: [providerId], references: [id])
  documentType    DocumentType
  expiryDate      DateTime     @db.Date
  filePath        String?      @db.VarChar(500)
  isExpired       Boolean      @default(false)
  daysUntilExpiry Int?
  uploadedBy      String?
  notes           String?
  createdAt       DateTime     @default(now())
  documentAlerts DocumentAlert[]
  @@map("fleet_documents")
}

model DocumentAlert {
  id               String        @id @default(uuid())
  documentId       String
  document         FleetDocument @relation(fields: [documentId], references: [id])
  daysBeforeExpiry Int
  notificationSent Boolean       @default(false)
  sentAt           DateTime?
  notifiedTo       Json?
  isResolved       Boolean       @default(false)
  createdAt        DateTime      @default(now())
  @@map("document_alerts")
}

model RentalContract {
  id             String   @id @default(uuid())
  vehicleId      String
  vehicle        Vehicle  @relation(fields: [vehicleId], references: [id])
  providerId     String
  provider       Provider @relation(fields: [providerId], references: [id])
  contractNumber String   @db.VarChar(50)
  startDate      DateTime @db.Date
  endDate        DateTime @db.Date
  monthlyCost    Decimal  @db.Decimal(10, 2)
  kmLimitMonthly Int?
  conditions     String?
  status         String   @default("active") @db.VarChar(20)
  inspectionIn   Json?
  inspectionOut  Json?
  filePath       String?  @db.VarChar(500)
  createdAt      DateTime @default(now())
  @@map("rental_contracts")
}

model KpiSnapshot {
  id                     String   @id @default(uuid())
  snapshotDate           DateTime @db.Date
  vehicleId              String?
  vehicle                Vehicle? @relation(fields: [vehicleId], references: [id])
  costPerKm              Decimal  @db.Decimal(8, 4)
  kmPerLiter             Decimal  @db.Decimal(6, 3)
  mechanicalAvailability Decimal  @db.Decimal(5, 2)
  mtbfDays               Decimal  @db.Decimal(6, 2)
  mttrHours              Decimal  @db.Decimal(6, 2)
  speedingEvents         Int      @default(0)
  idleHours              Decimal  @db.Decimal(6, 2)
  fuelCost               Decimal  @db.Decimal(10, 2)
  maintenanceCost        Decimal  @db.Decimal(10, 2)
  createdAt              DateTime @default(now())
  @@unique([snapshotDate, vehicleId])
  @@map("kpi_snapshots")
}

model FleetSummary {
  id                  String     @id @default(uuid())
  summaryDate         DateTime   @db.Date
  periodType          PeriodType
  regionId            String?
  region              Region?    @relation(fields: [regionId], references: [id])
  totalVehiclesActive Int        @default(0)
  totalKm             Decimal    @db.Decimal(10, 2)
  totalFuelLiters     Decimal    @db.Decimal(8, 2)
  totalFuelCost       Decimal    @db.Decimal(10, 2)
  totalMaintCost      Decimal    @db.Decimal(10, 2)
  avgCostPerKm        Decimal    @db.Decimal(8, 4)
  avgKmPerLiter       Decimal    @db.Decimal(6, 3)
  fleetAvailability   Decimal    @db.Decimal(5, 2)
  aiSavingsEstimated  Decimal?   @db.Decimal(10, 2)
  createdAt           DateTime   @default(now())
  @@map("fleet_summaries")
}

model PettyCashTransaction {
  id                String             @id @default(uuid())
  seqNumber         Int
  regionId          String
  region            Region             @relation(fields: [regionId], references: [id])
  staffId           String
  staff             Staff              @relation(fields: [staffId], references: [id])
  tripId            String?
  trip              Trip?              @relation(fields: [tripId], references: [id])
  transactionDate   DateTime           @db.Date
  concept           ConceptType
  expenseSubtype    String?            @db.VarChar(50)
  description       String?
  nodeCode          String?            @db.VarChar(50)
  vehiclePlate      String?            @db.VarChar(8)
  amount            Decimal            @db.Decimal(10, 2)
  status            TransactionStatus  @default(pendiente)
  voucherType       VoucherType?
  voucherNumber     String?            @db.VarChar(50)
  photoUrl          String?            @db.VarChar(500)
  reimbursementCode String?            @db.VarChar(100)
  reimbursementType ReimbursementType?
  weekNumber        Int?
  monthNumber       Int?
  observations      String?
  batchId           String?
  batch             ReimbursementBatch? @relation(fields: [batchId], references: [id])
  createdAt         DateTime           @default(now())
  @@map("petty_cash_transactions")
}

model PettyCashAccount {
  id              String   @id @default(uuid())
  regionId        String   @unique
  region          Region   @relation(fields: [regionId], references: [id])
  permanentFund   Decimal  @db.Decimal(10, 2)
  currentBalance  Decimal  @db.Decimal(10, 2)
  amountInField   Decimal  @db.Decimal(10, 2) @default(0)
  toBeSubmitted   Decimal  @db.Decimal(10, 2) @default(0)
  inReimbursement Decimal  @db.Decimal(10, 2) @default(0)
  gap             Decimal  @db.Decimal(10, 2) @default(0)
  periodStart     DateTime @db.Date
  isActive        Boolean  @default(true)
  updatedAt       DateTime @updatedAt
  @@map("petty_cash_accounts")
}

model ReimbursementBatch {
  id               String      @id @default(uuid())
  batchCode        String      @unique @db.VarChar(100)
  regionId         String
  region           Region      @relation(fields: [regionId], references: [id])
  staffId          String
  staff            Staff       @relation(fields: [staffId], references: [id])
  batchType        BatchType
  totalAmount      Decimal     @db.Decimal(10, 2)
  transactionCount Int         @default(0)
  status           BatchStatus @default(draft)
  submittedAt      DateTime?   @db.Date
  paidAt           DateTime?   @db.Date
  approvedBy       String?
  paymentReference String?     @db.VarChar(100)
  createdAt        DateTime    @default(now())
  transactions PettyCashTransaction[]
  @@map("reimbursement_batches")
}

model StaffBankAccount {
  id            String   @id @default(uuid())
  staffId       String
  staff         Staff    @relation(fields: [staffId], references: [id])
  bankName      String   @db.VarChar(100)
  accountNumber String   @db.VarChar(30)
  cci           String?  @db.VarChar(20)
  isPrimary     Boolean  @default(false)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  @@map("staff_bank_accounts")
}

model PettyCashLedger {
  id                     String   @id @default(uuid())
  staffId                String
  staff                  Staff    @relation(fields: [staffId], references: [id])
  regionId               String
  region                 Region   @relation(fields: [regionId], references: [id])
  ledgerDate             DateTime @db.Date
  totalDisbursed         Decimal  @db.Decimal(10, 2)
  totalRendered          Decimal  @db.Decimal(10, 2)
  inField                Decimal  @db.Decimal(10, 2)
  toSubmit               Decimal  @db.Decimal(10, 2)
  inReimbursementProcess Decimal  @db.Decimal(10, 2)
  gap                    Decimal  @db.Decimal(10, 2)
  createdAt              DateTime @default(now())
  @@map("petty_cash_ledger")
}

model Alert {
  id          String        @id @default(uuid())
  vehicleId   String?
  vehicle     Vehicle?      @relation(fields: [vehicleId], references: [id])
  driverId    String?
  driver      Driver?       @relation(fields: [driverId], references: [id])
  teamId      String?
  team        Team?         @relation(fields: [teamId], references: [id])
  alertType   AlertType
  title       String        @db.VarChar(200)
  description String?
  severity    AlertSeverity
  latitude    Decimal?      @db.Decimal(10, 7)
  longitude   Decimal?      @db.Decimal(10, 7)
  isResolved  Boolean       @default(false)
  resolvedAt  DateTime?
  resolvedBy  String?
  createdAt   DateTime      @default(now())
  @@map("alerts")
}

model Task {
  id          String     @id @default(uuid())
  teamId      String
  team        Team       @relation(fields: [teamId], references: [id])
  assignedTo  String?
  staff       Staff?     @relation(fields: [assignedTo], references: [id])
  nodeId      String?
  node        Node?      @relation(fields: [nodeId], references: [id])
  taskType    TaskType
  title       String     @db.VarChar(200)
  description String?
  priority    Priority   @default(med)
  status      TaskStatus @default(pending)
  dueDate     DateTime?  @db.Date
  completedAt DateTime?
  createdAt   DateTime   @default(now())
  taskEvents TaskEvent[]
  @@map("tasks")
}

model TaskEvent {
  id             String            @id @default(uuid())
  taskId         String
  task           Task              @relation(fields: [taskId], references: [id])
  teamId         String
  staffId        String
  staff          Staff             @relation(fields: [staffId], references: [id])
  eventType      String            @db.VarChar(50)
  latitude       Decimal?          @db.Decimal(10, 7)
  longitude      Decimal?          @db.Decimal(10, 7)
  photoUrls      Json?
  notes          String?
  isForceMajeure Boolean           @default(false)
  fmType         ForceMajeureType?
  recordedAt     DateTime          @default(now())
  @@map("task_events")
}
```

- [ ] **Step 3: Run migration**

```bash
cd apps/api
npx prisma migrate dev --name init_complete_schema
```

Expected: Migration created and applied. Tables created in PostgreSQL.

- [ ] **Step 4: Generate Prisma client**

```bash
npx prisma generate
```

Expected: `node_modules/@prisma/client` updated.

- [ ] **Step 5: Verify tables exist**

```bash
npx prisma studio
```

Open `http://localhost:5555` — should see all tables listed.

- [ ] **Step 6: Commit**

```bash
cd ../..
git add apps/api/prisma/
git commit -m "feat: complete prisma schema with 28 tables and all enums"
```

---

### Task 6: apps/web — Next.js Scaffold

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/tsconfig.json`

- [ ] **Step 1: Create Next.js app**

```bash
cd apps/web
npx create-next-app@14 . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
```

- [ ] **Step 2: Add shared dependency to package.json**

Add to `apps/web/package.json` dependencies:
```json
"@flotaos/shared": "*",
"recharts": "^2.12.0",
"swr": "^2.2.5",
"socket.io-client": "^4.7.5"
```

Then run: `cd apps/web && npm install`

- [ ] **Step 3: Commit**

```bash
cd ../..
git add apps/web/
git commit -m "feat: scaffold next.js 14 web dashboard"
```

---

### Task 7: apps/mobile — Expo Scaffold

**Files:**
- Create: `apps/mobile/package.json` (via Expo CLI)

- [ ] **Step 1: Create Expo app**

```bash
cd apps/mobile
npx create-expo-app@latest . --template blank-typescript
```

- [ ] **Step 2: Add dependencies to apps/mobile/package.json**

```bash
npx expo install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context
npx expo install expo-camera expo-location expo-file-system
npx expo install @nozbe/watermelondb
npm install @flotaos/shared
npm install axios @tanstack/react-query zustand
```

- [ ] **Step 3: Add WatermelonDB native setup**

In `apps/mobile/package.json` add to babel config:
```json
{
  "babel": {
    "plugins": ["@babel/plugin-proposal-decorators"]
  }
}
```

- [ ] **Step 4: Commit**

```bash
cd ../..
git add apps/mobile/
git commit -m "feat: scaffold expo react native mobile app with watermelondb"
```

---

### Task 8: Final Verification

- [ ] **Step 1: Verify monorepo builds**

```bash
npm install
npm run build
```

Expected: `packages/shared` builds without errors.

- [ ] **Step 2: Verify API starts**

```bash
cd apps/api && cp ../../.env.example .env
npm run dev
```

Expected:
```
PostgreSQL connected
MinIO bucket 'fleet-docs' created
API running on port 3001
```

- [ ] **Step 3: Test health endpoint**

```bash
curl http://localhost:3001/health
```

Expected: `{"status":"ok","ts":"2026-..."}`

- [ ] **Step 4: Final commit and push**

```bash
cd ../..
git add .
git commit -m "feat: complete day 1 - monorepo, infra, prisma schema, app scaffolds"
git push origin develop
```

---

**Plan 1 complete. Plans 2 (API), 3 (Mobile), and 4 (Web) can now be executed — Plans 3 and 4 can scaffold in parallel with Plan 2.**
