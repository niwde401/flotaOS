import { Worker, Job } from 'bullmq'
import { redis } from '../../lib/redis'
import { prisma } from '../../lib/prisma'

const REDIS_DISABLED = process.env.REDIS_DISABLED === 'true'

async function calcularKPIsDelDia() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const vehicles = await prisma.vehicle.findMany({ where: { status: 'active' } })

  for (const vehicle of vehicles) {
    const fuelRecords = await prisma.fuelRecord.findMany({
      where: { vehicleId: vehicle.id, recordedAt: { gte: today } },
    })

    const totalFuelCost = fuelRecords.reduce((s, r) => s + Number(r.totalCost), 0)
    const totalLiters = fuelRecords.reduce((s, r) => s + Number(r.liters), 0)
    const maintenanceRecords = await prisma.maintenanceRecord.findMany({
      where: { vehiculoId: vehicle.id, fechaServicio: { gte: today } },
    })
    const totalMaintCost = maintenanceRecords.reduce((s, r) => s + Number(r.costoTotal), 0)

    await prisma.kpiSnapshot.upsert({
      where: { snapshotDate_vehicleId: { snapshotDate: today, vehicleId: vehicle.id } },
      update: {
        fuelCost: totalFuelCost,
        maintenanceCost: totalMaintCost,
        kmPerLiter: 0, // TODO: compute from odometer delta when GPS data is available
      },
      create: {
        snapshotDate: today,
        vehicleId: vehicle.id,
        costPerKm: 0,
        kmPerLiter: 0, // TODO: compute from odometer delta when GPS data is available
        mechanicalAvailability: 100,
        mtbfDays: 0,
        mttrHours: 0,
        speedingEvents: 0,
        idleHours: 0,
        fuelCost: totalFuelCost,
        maintenanceCost: totalMaintCost,
      },
    })
  }
  console.log(`[KPI] Snapshots updated for ${vehicles.length} vehicles`)
}

export const kpiWorker = REDIS_DISABLED
  ? null
  : new Worker(
      'kpi-snapshots',
      async (_job: Job) => { await calcularKPIsDelDia() },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { connection: redis as any }
    )

if (kpiWorker) {
  kpiWorker.on('completed', (job) => console.log(`[KPI] Job ${job.id} completed`))
  kpiWorker.on('failed', (job, err) => console.error(`[KPI] Job ${job?.id} failed:`, err))
}
