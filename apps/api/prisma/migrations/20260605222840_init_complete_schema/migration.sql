-- CreateEnum
CREATE TYPE "Role" AS ENUM ('driver', 'tecnico', 'supervisor', 'coordinador', 'asistente', 'director');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('own', 'rented');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('active', 'inactive', 'in_maintenance', 'out_of_service');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('gasoline', 'diesel', 'hybrid');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('scheduled', 'active', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('llegada_sitio', 'parada', 'reinicio', 'llegada_destino', 'ingreso_taller', 'salida_taller');

-- CreateEnum
CREATE TYPE "ForceMajeureType" AS ENUM ('derrumbe', 'inundacion', 'caida_puente', 'lluvias', 'contingencia_social', 'otros');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('instalacion', 'mantenimiento_preventivo', 'mantenimiento_correctivo', 'carga_generador', 'inspeccion', 'otro');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('low', 'med', 'high');

-- CreateEnum
CREATE TYPE "ConceptType" AS ENUM ('vehicle_fuel', 'dg_refuel', 'peajes', 'viaticos', 'consumibles', 'vehicle_expenses', 'operation_expense', 'boat_expense', 'otros');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('rendido', 'pendiente', 'pendiente_carga_f', 'en_reembolso', 'inhouse', 'expense_record', 'observado', 'depositado');

-- CreateEnum
CREATE TYPE "VoucherType" AS ENUM ('factura', 'boleta', 'recibo', 'otro');

-- CreateEnum
CREATE TYPE "ReimbursementType" AS ENUM ('bank_transfer', 'cash', 'other');

-- CreateEnum
CREATE TYPE "BatchType" AS ENUM ('weekly', 'monthly', 'special');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('draft', 'submitted', 'approved', 'paid');

-- CreateEnum
CREATE TYPE "MaintenanceUnit" AS ENUM ('km', 'horas', 'meses');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('preventive', 'corrective', 'emergency');

-- CreateEnum
CREATE TYPE "OTStatus" AS ENUM ('pending', 'en_taller', 'completada', 'cancelled');

-- CreateEnum
CREATE TYPE "OTUrgency" AS ENUM ('normal', 'urgent', 'critical');

-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('site', 'node', 'hub', 'depot');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('soat', 'technical_revision', 'circulation_permit', 'insurance', 'rental_contract', 'driver_license', 'medical_cert', 'others');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('low', 'med', 'high', 'critical');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('geocerca_entrada', 'geocerca_salida', 'exceso_velocidad', 'ralenti_prolongado', 'zona_restringida', 'bateria_baja', 'sin_senal', 'fuerza_mayor', 'doc_vencimiento', 'mantenimiento_vencido');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('mejor_conductor_semana', 'mejor_km_l', 'cero_eventos_mes', 'puntualidad', 'reconocimiento_especial');

-- CreateEnum
CREATE TYPE "PeriodType" AS ENUM ('daily', 'weekly', 'monthly');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('low', 'med', 'high', 'critical');

-- CreateEnum
CREATE TYPE "AnomalyType" AS ENUM ('consumo_excesivo', 'perdida_combustible', 'carga_no_registrada', 'rendimiento_bajo');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regions" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "coordinatorId" TEXT,
    "colorHex" VARCHAR(6) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zones" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "regionId" TEXT NOT NULL,
    "supervisorId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL,
    "companyName" VARCHAR(200) NOT NULL,
    "ruc" VARCHAR(11) NOT NULL,
    "contactName" VARCHAR(100) NOT NULL,
    "contactPhone" VARCHAR(20) NOT NULL,
    "contactEmail" VARCHAR(100) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "plateNumber" VARCHAR(8) NOT NULL,
    "brand" VARCHAR(50) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "year" INTEGER NOT NULL,
    "vehicleType" "VehicleType" NOT NULL,
    "status" "VehicleStatus" NOT NULL DEFAULT 'active',
    "fuelType" "FuelType" NOT NULL,
    "currentKm" INTEGER NOT NULL DEFAULT 0,
    "horometroActual" INTEGER NOT NULL DEFAULT 0,
    "providerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" VARCHAR(200) NOT NULL,
    "dni" VARCHAR(8) NOT NULL,
    "licenseNumber" VARCHAR(20) NOT NULL,
    "licenseExpiry" DATE NOT NULL,
    "licenseCategory" VARCHAR(5) NOT NULL,
    "medicalCertExpiry" DATE NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 100,
    "assignedVehicleId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" VARCHAR(200) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "regionId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "teamId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "regionId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "supervisorId" TEXT,
    "tripDate" DATE NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "subgroup" INTEGER NOT NULL,
    "nodeAssigned" VARCHAR(50),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nodes" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "regionId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "nodeType" "NodeType" NOT NULL,
    "hasGenerator" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gps_tracks" (
    "id" BIGSERIAL NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "speed" INTEGER NOT NULL,
    "heading" INTEGER NOT NULL,
    "altitude" INTEGER NOT NULL,
    "engineOn" BOOLEAN NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gps_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geofences" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "coordinates" JSONB NOT NULL,
    "alertOnEntry" BOOLEAN NOT NULL DEFAULT true,
    "alertOnExit" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "geofences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geofence_events" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "geofenceId" TEXT NOT NULL,
    "eventType" VARCHAR(10) NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "geofence_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "origin" VARCHAR(200) NOT NULL,
    "destination" VARCHAR(200) NOT NULL,
    "nodeCode" VARCHAR(50),
    "tripDate" DATE NOT NULL,
    "status" "TripStatus" NOT NULL DEFAULT 'scheduled',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "totalKm" DECIMAL(8,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_events" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "photoUrl" VARCHAR(500),
    "notes" TEXT,
    "isForceMajeure" BOOLEAN NOT NULL DEFAULT false,
    "fmType" "ForceMajeureType",
    "fmPhotos" JSONB,
    "diagnostico" TEXT,
    "kmEntrada" INTEGER,
    "kmSalida" INTEGER,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_submissions" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "itemsJson" JSONB NOT NULL,
    "hasIssues" BOOLEAN NOT NULL DEFAULT false,
    "vehicleBlocked" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalogo_mantenimiento" (
    "id" TEXT NOT NULL,
    "nombreElemento" VARCHAR(100) NOT NULL,
    "unidadMedida" "MaintenanceUnit" NOT NULL,
    "descripcion" TEXT,
    "procedimientoSop" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "catalogo_mantenimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_mantenimiento" (
    "id" TEXT NOT NULL,
    "vehiculoId" TEXT NOT NULL,
    "elementoId" TEXT NOT NULL,
    "frecuenciaValor" INTEGER NOT NULL,
    "frecuenciaUnidad" "MaintenanceUnit" NOT NULL,
    "alertaAmarilla" INTEGER NOT NULL,
    "alertaRoja" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_mantenimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_records" (
    "id" TEXT NOT NULL,
    "vehiculoId" TEXT NOT NULL,
    "elementoId" TEXT NOT NULL,
    "ordenTrabajoId" TEXT,
    "fechaServicio" DATE NOT NULL,
    "lecturaOdometro" INTEGER NOT NULL,
    "lecturaHorometro" INTEGER NOT NULL,
    "costoRepuestos" DECIMAL(10,2) NOT NULL,
    "costoManoObra" DECIMAL(10,2) NOT NULL,
    "costoTotal" DECIMAL(10,2) NOT NULL,
    "tallerProveedor" VARCHAR(100),
    "tipoServicio" "ServiceType" NOT NULL,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes_trabajo" (
    "id" TEXT NOT NULL,
    "vehiculoId" TEXT NOT NULL,
    "tripEventId" TEXT,
    "numeroOt" VARCHAR(20) NOT NULL,
    "fechaProgramada" DATE NOT NULL,
    "fechaCompletada" DATE,
    "status" "OTStatus" NOT NULL DEFAULT 'pending',
    "urgencia" "OTUrgency" NOT NULL DEFAULT 'normal',
    "taller" VARCHAR(100),
    "costoEstimado" DECIMAL(10,2),
    "costoReal" DECIMAL(10,2),
    "trabajos" JSONB,
    "repuestos" JSONB,
    "generadoPor" TEXT,
    "diagnostico" TEXT,
    "kmEntrada" INTEGER,
    "kmSalida" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordenes_trabajo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spare_parts" (
    "id" TEXT NOT NULL,
    "partNumber" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "stockQty" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(8,2) NOT NULL,
    "supplier" VARCHAR(100),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spare_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_predictions" (
    "id" TEXT NOT NULL,
    "vehiculoId" TEXT NOT NULL,
    "componente" VARCHAR(100) NOT NULL,
    "nivelRiesgo" "RiskLevel" NOT NULL,
    "kmEstimadoFalla" INTEGER NOT NULL,
    "costoPreventivo" DECIMAL(10,2) NOT NULL,
    "costoCorrectivo" DECIMAL(10,2) NOT NULL,
    "resumenIa" TEXT,
    "analizadoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertas_mantenimiento" (
    "id" TEXT NOT NULL,
    "vehiculoId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "tipoAlerta" VARCHAR(50) NOT NULL,
    "urgencia" "OTUrgency" NOT NULL,
    "kmVencimiento" INTEGER,
    "fechaVencimiento" DATE,
    "notificacionEnviada" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alertas_mantenimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuel_records" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "tripId" TEXT,
    "liters" DECIMAL(6,2) NOT NULL,
    "totalCost" DECIMAL(8,2) NOT NULL,
    "kmAtRefuel" INTEGER NOT NULL,
    "fuelCardId" VARCHAR(20),
    "stationName" VARCHAR(100),
    "receiptPhoto" VARCHAR(500),
    "isAnomaly" BOOLEAN NOT NULL DEFAULT false,
    "anomalyType" VARCHAR(30),
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fuel_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuel_anomalies" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "anomalyType" "AnomalyType" NOT NULL,
    "description" TEXT,
    "severity" "AlertSeverity" NOT NULL,
    "estimatedLoss" DECIMAL(8,2),
    "claudeAnalysis" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fuel_anomalies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idle_records" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "litersWasted" DECIMAL(6,2) NOT NULL,
    "costWasted" DECIMAL(8,2) NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "idle_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuel_cards" (
    "id" TEXT NOT NULL,
    "cardNumber" VARCHAR(20) NOT NULL,
    "vehicleId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "fuel_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driving_events" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "eventType" VARCHAR(50) NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "speed" INTEGER NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driving_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_scores" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "scoreDate" DATE NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "harshBrakingCount" INTEGER NOT NULL DEFAULT 0,
    "harshAccelCount" INTEGER NOT NULL DEFAULT 0,
    "speedingCount" INTEGER NOT NULL DEFAULT 0,
    "idleMinutes" INTEGER NOT NULL DEFAULT 0,
    "kmPerLiter" DECIMAL(6,3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fatigue_records" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "workDate" DATE NOT NULL,
    "hoursDriven" DECIMAL(4,2) NOT NULL,
    "breaksTaken" INTEGER NOT NULL DEFAULT 0,
    "limitReached" BOOLEAN NOT NULL DEFAULT false,
    "lastBreakAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fatigue_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_rewards" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "rewardType" "RewardType" NOT NULL,
    "description" VARCHAR(200) NOT NULL,
    "awardedDate" DATE NOT NULL,
    "period" VARCHAR(20) NOT NULL,
    "isClaimed" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fleet_documents" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT,
    "driverId" TEXT,
    "providerId" TEXT,
    "documentType" "DocumentType" NOT NULL,
    "expiryDate" DATE NOT NULL,
    "filePath" VARCHAR(500),
    "isExpired" BOOLEAN NOT NULL DEFAULT false,
    "daysUntilExpiry" INTEGER,
    "uploadedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fleet_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_alerts" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "daysBeforeExpiry" INTEGER NOT NULL,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "notifiedTo" JSONB,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_contracts" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "contractNumber" VARCHAR(50) NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "monthlyCost" DECIMAL(10,2) NOT NULL,
    "kmLimitMonthly" INTEGER,
    "conditions" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "inspectionIn" JSONB,
    "inspectionOut" JSONB,
    "filePath" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rental_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_snapshots" (
    "id" TEXT NOT NULL,
    "snapshotDate" DATE NOT NULL,
    "vehicleId" TEXT,
    "costPerKm" DECIMAL(8,4) NOT NULL,
    "kmPerLiter" DECIMAL(6,3) NOT NULL,
    "mechanicalAvailability" DECIMAL(5,2) NOT NULL,
    "mtbfDays" DECIMAL(6,2) NOT NULL,
    "mttrHours" DECIMAL(6,2) NOT NULL,
    "speedingEvents" INTEGER NOT NULL DEFAULT 0,
    "idleHours" DECIMAL(6,2) NOT NULL,
    "fuelCost" DECIMAL(10,2) NOT NULL,
    "maintenanceCost" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kpi_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fleet_summaries" (
    "id" TEXT NOT NULL,
    "summaryDate" DATE NOT NULL,
    "periodType" "PeriodType" NOT NULL,
    "regionId" TEXT,
    "totalVehiclesActive" INTEGER NOT NULL DEFAULT 0,
    "totalKm" DECIMAL(10,2) NOT NULL,
    "totalFuelLiters" DECIMAL(8,2) NOT NULL,
    "totalFuelCost" DECIMAL(10,2) NOT NULL,
    "totalMaintCost" DECIMAL(10,2) NOT NULL,
    "avgCostPerKm" DECIMAL(8,4) NOT NULL,
    "avgKmPerLiter" DECIMAL(6,3) NOT NULL,
    "fleetAvailability" DECIMAL(5,2) NOT NULL,
    "aiSavingsEstimated" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fleet_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "petty_cash_transactions" (
    "id" TEXT NOT NULL,
    "seqNumber" INTEGER NOT NULL,
    "regionId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "tripId" TEXT,
    "transactionDate" DATE NOT NULL,
    "concept" "ConceptType" NOT NULL,
    "expenseSubtype" VARCHAR(50),
    "description" TEXT,
    "nodeCode" VARCHAR(50),
    "vehiclePlate" VARCHAR(8),
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'pendiente',
    "voucherType" "VoucherType",
    "voucherNumber" VARCHAR(50),
    "photoUrl" VARCHAR(500),
    "reimbursementCode" VARCHAR(100),
    "reimbursementType" "ReimbursementType",
    "weekNumber" INTEGER,
    "monthNumber" INTEGER,
    "observations" TEXT,
    "batchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "petty_cash_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "petty_cash_accounts" (
    "id" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "permanentFund" DECIMAL(10,2) NOT NULL,
    "currentBalance" DECIMAL(10,2) NOT NULL,
    "amountInField" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "toBeSubmitted" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "inReimbursement" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "gap" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "periodStart" DATE NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "petty_cash_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reimbursement_batches" (
    "id" TEXT NOT NULL,
    "batchCode" VARCHAR(100) NOT NULL,
    "regionId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "batchType" "BatchType" NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "transactionCount" INTEGER NOT NULL DEFAULT 0,
    "status" "BatchStatus" NOT NULL DEFAULT 'draft',
    "submittedAt" DATE,
    "paidAt" DATE,
    "approvedBy" TEXT,
    "paymentReference" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reimbursement_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_bank_accounts" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "bankName" VARCHAR(100) NOT NULL,
    "accountNumber" VARCHAR(30) NOT NULL,
    "cci" VARCHAR(20),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "petty_cash_ledger" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "ledgerDate" DATE NOT NULL,
    "totalDisbursed" DECIMAL(10,2) NOT NULL,
    "totalRendered" DECIMAL(10,2) NOT NULL,
    "inField" DECIMAL(10,2) NOT NULL,
    "toSubmit" DECIMAL(10,2) NOT NULL,
    "inReimbursementProcess" DECIMAL(10,2) NOT NULL,
    "gap" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "petty_cash_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT,
    "driverId" TEXT,
    "teamId" TEXT,
    "alertType" "AlertType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "severity" "AlertSeverity" NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "assignedTo" TEXT,
    "nodeId" TEXT,
    "taskType" "TaskType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'med',
    "status" "TaskStatus" NOT NULL DEFAULT 'pending',
    "dueDate" DATE,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_events" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "eventType" VARCHAR(50) NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "photoUrls" JSONB,
    "notes" TEXT,
    "isForceMajeure" BOOLEAN NOT NULL DEFAULT false,
    "fmType" "ForceMajeureType",
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "regions_code_key" ON "regions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "providers_ruc_key" ON "providers"("ruc");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plateNumber_key" ON "vehicles"("plateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_userId_key" ON "drivers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_dni_key" ON "drivers"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "staff_userId_key" ON "staff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "nodes_code_key" ON "nodes"("code");

-- CreateIndex
CREATE INDEX "gps_tracks_vehicleId_recordedAt_idx" ON "gps_tracks"("vehicleId", "recordedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_trabajo_numeroOt_key" ON "ordenes_trabajo"("numeroOt");

-- CreateIndex
CREATE UNIQUE INDEX "fuel_cards_cardNumber_key" ON "fuel_cards"("cardNumber");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_snapshots_snapshotDate_vehicleId_key" ON "kpi_snapshots"("snapshotDate", "vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "petty_cash_accounts_regionId_key" ON "petty_cash_accounts"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "reimbursement_batches_batchCode_key" ON "reimbursement_batches"("batchCode");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zones" ADD CONSTRAINT "zones_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_assignedVehicleId_fkey" FOREIGN KEY ("assignedVehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gps_tracks" ADD CONSTRAINT "gps_tracks_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geofence_events" ADD CONSTRAINT "geofence_events_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geofence_events" ADD CONSTRAINT "geofence_events_geofenceId_fkey" FOREIGN KEY ("geofenceId") REFERENCES "geofences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_events" ADD CONSTRAINT "trip_events_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_events" ADD CONSTRAINT "trip_events_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_events" ADD CONSTRAINT "trip_events_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_submissions" ADD CONSTRAINT "checklist_submissions_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_submissions" ADD CONSTRAINT "checklist_submissions_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_submissions" ADD CONSTRAINT "checklist_submissions_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_mantenimiento" ADD CONSTRAINT "plan_mantenimiento_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_mantenimiento" ADD CONSTRAINT "plan_mantenimiento_elementoId_fkey" FOREIGN KEY ("elementoId") REFERENCES "catalogo_mantenimiento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_elementoId_fkey" FOREIGN KEY ("elementoId") REFERENCES "catalogo_mantenimiento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_ordenTrabajoId_fkey" FOREIGN KEY ("ordenTrabajoId") REFERENCES "ordenes_trabajo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_tripEventId_fkey" FOREIGN KEY ("tripEventId") REFERENCES "trip_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_predictions" ADD CONSTRAINT "maintenance_predictions_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas_mantenimiento" ADD CONSTRAINT "alertas_mantenimiento_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas_mantenimiento" ADD CONSTRAINT "alertas_mantenimiento_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plan_mantenimiento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_records" ADD CONSTRAINT "fuel_records_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_records" ADD CONSTRAINT "fuel_records_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_records" ADD CONSTRAINT "fuel_records_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_anomalies" ADD CONSTRAINT "fuel_anomalies_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_anomalies" ADD CONSTRAINT "fuel_anomalies_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idle_records" ADD CONSTRAINT "idle_records_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idle_records" ADD CONSTRAINT "idle_records_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driving_events" ADD CONSTRAINT "driving_events_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driving_events" ADD CONSTRAINT "driving_events_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_scores" ADD CONSTRAINT "driver_scores_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fatigue_records" ADD CONSTRAINT "fatigue_records_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_rewards" ADD CONSTRAINT "driver_rewards_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fleet_documents" ADD CONSTRAINT "fleet_documents_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fleet_documents" ADD CONSTRAINT "fleet_documents_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fleet_documents" ADD CONSTRAINT "fleet_documents_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_alerts" ADD CONSTRAINT "document_alerts_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "fleet_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_contracts" ADD CONSTRAINT "rental_contracts_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_contracts" ADD CONSTRAINT "rental_contracts_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_snapshots" ADD CONSTRAINT "kpi_snapshots_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fleet_summaries" ADD CONSTRAINT "fleet_summaries_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petty_cash_transactions" ADD CONSTRAINT "petty_cash_transactions_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petty_cash_transactions" ADD CONSTRAINT "petty_cash_transactions_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petty_cash_transactions" ADD CONSTRAINT "petty_cash_transactions_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petty_cash_transactions" ADD CONSTRAINT "petty_cash_transactions_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "reimbursement_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petty_cash_accounts" ADD CONSTRAINT "petty_cash_accounts_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reimbursement_batches" ADD CONSTRAINT "reimbursement_batches_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reimbursement_batches" ADD CONSTRAINT "reimbursement_batches_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_bank_accounts" ADD CONSTRAINT "staff_bank_accounts_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petty_cash_ledger" ADD CONSTRAINT "petty_cash_ledger_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petty_cash_ledger" ADD CONSTRAINT "petty_cash_ledger_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_events" ADD CONSTRAINT "task_events_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_events" ADD CONSTRAINT "task_events_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
