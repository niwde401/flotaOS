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
