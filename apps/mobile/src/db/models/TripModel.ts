import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class TripModel extends Model {
  static table = 'trips'

  @field('server_id') serverId!: string | null
  @field('team_id') teamId!: string
  @field('vehicle_id') vehicleId!: string
  @field('driver_id') driverId!: string
  @field('origin') origin!: string
  @field('destination') destination!: string
  @field('status') status!: string
  @field('synced') synced!: boolean
  @date('trip_date') tripDate!: Date
  @readonly @date('created_at') createdAt!: Date
}
