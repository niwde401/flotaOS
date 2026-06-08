import { database, TripEventModel, ExpenseModel } from '../db'
import { Q } from '@nozbe/watermelondb'
import { tripsApi } from '../api/trips'
import { expensesApi } from '../api/expenses'
import { ConceptType, EventType, ForceMajeureType } from '@flotaos/shared'

let syncRunning = false

export async function runSync(): Promise<void> {
  if (syncRunning) return
  syncRunning = true

  try {
    const unsyncedEvents = await database
      .get<TripEventModel>('trip_events')
      .query(Q.where('synced', false))
      .fetch()

    for (const ev of unsyncedEvents) {
      if (!ev.tripServerId) continue
      try {
        await tripsApi.createEvent(ev.tripServerId, {
          eventType: ev.eventType as EventType,
          latitude: ev.latitude,
          longitude: ev.longitude,
          notes: ev.notes ?? undefined,
          photoUrl: ev.photoUrl ?? undefined,
          isForceMajeure: ev.isForceMajeure,
          fmType: ev.fmType ? (ev.fmType as ForceMajeureType) : undefined,
          fmPhotos: ev.fmPhotos?.length ? ev.fmPhotos : undefined,
          diagnostico: ev.diagnostico ?? undefined,
          kmEntrada: ev.kmEntrada ?? undefined,
          kmSalida: ev.kmSalida ?? undefined,
          trabajosRealizados: ev.trabajosRealizados ?? undefined,
        })
        await database.write(async () => {
          await ev.update((e) => { e.synced = true })
        })
      } catch (err) {
        console.warn('Sync event failed:', err)
      }
    }

    const unsyncedExpenses = await database
      .get<ExpenseModel>('expenses')
      .query(Q.where('synced', false))
      .fetch()

    for (const exp of unsyncedExpenses) {
      try {
        const created = await expensesApi.create({
          tripId: exp.tripServerId ?? undefined,
          concept: exp.concept as ConceptType,
          description: exp.description ?? undefined,
          amount: exp.amount,
          voucherNumber: exp.voucherNumber ?? undefined,
          photoUrl: exp.photoUrl ?? undefined,
        })
        await database.write(async () => {
          await exp.update((e) => {
            e.synced = true
            e.serverId = created.id
          })
        })
      } catch (err) {
        console.warn('Sync expense failed:', err)
      }
    }
  } finally {
    syncRunning = false
  }
}

export function startSyncInterval(intervalMs = 30000): () => void {
  const id = setInterval(runSync, intervalMs)
  return () => clearInterval(id)
}
