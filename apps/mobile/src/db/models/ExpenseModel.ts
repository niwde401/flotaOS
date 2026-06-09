import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class ExpenseModel extends Model {
  static table = 'expenses'

  @field('server_id') serverId!: string | null
  @field('trip_id') tripId!: string | null
  @field('trip_server_id') tripServerId!: string | null
  @field('concept') concept!: string
  @field('description') description!: string | null
  @field('node_code') nodeCode!: string | null
  @field('vehicle_plate') vehiclePlate!: string | null
  @field('amount') amount!: number
  @field('voucher_type') voucherType!: string | null
  @field('voucher_number') voucherNumber!: string | null
  @field('photo_url') photoUrl!: string | null
  @field('photo_local_path') photoLocalPath!: string | null
  @field('status') status!: string
  @field('synced') synced!: boolean
  @date('transaction_date') transactionDate!: Date
  @readonly @date('created_at') createdAt!: Date
}
