import { Worker, Job } from 'bullmq'
import { redis } from '../../lib/redis'
import { prisma } from '../../lib/prisma'

const REDIS_DISABLED = process.env.REDIS_DISABLED === 'true'

async function generarAlertasVencimiento() {
  const today = new Date()
  const in60Days = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000)

  const expiringDocs = await prisma.fleetDocument.findMany({
    where: {
      expiryDate: { lte: in60Days },
      isExpired: false,
    },
    include: { vehicle: { select: { plateNumber: true } } },
  })

  for (const doc of expiringDocs) {
    const daysUntil = Math.ceil((doc.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    await prisma.fleetDocument.update({
      where: { id: doc.id },
      data: {
        daysUntilExpiry: daysUntil,
        isExpired: daysUntil <= 0,
      },
    })

    const existing = await prisma.documentAlert.findFirst({
      where: { documentId: doc.id, isResolved: false },
    })
    if (!existing) {
      await prisma.documentAlert.create({
        data: {
          documentId: doc.id,
          daysBeforeExpiry: daysUntil,
        },
      })
    }
  }
  console.log(`[Alert] Document alerts checked: ${expiringDocs.length} expiring`)
}

export const alertWorker = REDIS_DISABLED
  ? null
  : new Worker(
      'doc-alerts',
      async (_job: Job) => { await generarAlertasVencimiento() },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { connection: redis as any }
    )

if (alertWorker) {
  alertWorker.on('failed', (job, err) => console.error(`[Alert] Job ${job?.id} failed:`, err))
}
