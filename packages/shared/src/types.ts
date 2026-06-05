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
