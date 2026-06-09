import { UserContext } from '@flotaos/shared'

export function scopeFilter(ctx: UserContext): Record<string, unknown> {
  switch (ctx.role) {
    case 'driver':
      return { driverId: ctx.driverId }
    case 'tecnico':
      return { team: { id: ctx.teamId } }
    case 'supervisor':
      return { team: { zone: { id: ctx.zoneId } } }
    case 'coordinador':
    case 'asistente':
      return { team: { zone: { regionId: ctx.regionId } } }
    case 'director':
    default:
      return {}
  }
}

export function vehicleScopeFilter(ctx: UserContext): Record<string, unknown> {
  switch (ctx.role) {
    case 'driver':
      return { id: ctx.driverId ? undefined : undefined, drivers: { some: { userId: ctx.userId } } }
    case 'tecnico':
    case 'supervisor':
      return { teams: { some: { zoneId: ctx.zoneId || undefined } } }
    case 'coordinador':
    case 'asistente':
      return { teams: { some: { zone: { regionId: ctx.regionId } } } }
    case 'director':
    default:
      return {}
  }
}
