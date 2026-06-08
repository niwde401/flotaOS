import { Model } from '@nozbe/watermelondb'
import { field, date, readonly, json } from '@nozbe/watermelondb/decorators'

function sanitizeStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.filter((v) => typeof v === 'string')
  return []
}

export default class TripEventModel extends Model {
  static table = 'trip_events'

  @field('server_id') serverId!: string | null
  @field('trip_id') tripId!: string
  @field('trip_server_id') tripServerId!: string | null
  @field('event_type') eventType!: string
  @field('latitude') latitude!: number
  @field('longitude') longitude!: number
  @field('photo_url') photoUrl!: string | null
  @field('notes') notes!: string | null
  @field('is_force_majeure') isForceMajeure!: boolean
  @field('fm_type') fmType!: string | null
  @json('fm_photos', sanitizeStringArray) fmPhotos!: string[]
  @field('diagnostico') diagnostico!: string | null
  @field('km_entrada') kmEntrada!: number | null
  @field('km_salida') kmSalida!: number | null
  @field('trabajos_realizados') trabajosRealizados!: string | null
  @field('synced') synced!: boolean
  @date('recorded_at') recordedAt!: Date
  @readonly @date('created_at') createdAt!: Date
}
