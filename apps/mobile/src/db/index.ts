import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'
import schema from './schema'
import TripModel from './models/TripModel'
import TripEventModel from './models/TripEventModel'
import ExpenseModel from './models/ExpenseModel'

const adapter = new SQLiteAdapter({
  schema,
  dbName: 'flotaos',
  jsi: true,
  onSetUpError: (error) => console.error('WatermelonDB setup error:', error),
})

export const database = new Database({
  adapter,
  modelClasses: [TripModel, TripEventModel, ExpenseModel],
})

export { TripModel, TripEventModel, ExpenseModel }
