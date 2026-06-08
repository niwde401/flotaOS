import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.get('/snapshots', requireAuth, async (req: Request, res: Response) => {
  try {
    const { vehicleId, days } = req.query
    const since = new Date()
    since.setDate(since.getDate() - (parseInt(days as string) || 30))

    const snapshots = await prisma.kpiSnapshot.findMany({
      where: {
        snapshotDate: { gte: since },
        ...(vehicleId && { vehicleId: vehicleId as string }),
      },
      include: { vehicle: { select: { plateNumber: true, brand: true } } },
      orderBy: { snapshotDate: 'desc' },
    })
    return res.json({ success: true, data: snapshots })
  } catch (err) {
    console.error('GET kpi snapshots error:', err)
    return res.status(500).json({ success: false, error: { code: 'INTERNAL', message: 'Internal server error' } })
  }
})

router.get('/fleet-summary', requireAuth, async (req: Request, res: Response) => {
  try {
    const { regionId } = req.query
    const summaries = await prisma.fleetSummary.findMany({
      where: {
        ...(regionId && { regionId: regionId as string }),
      },
      include: { region: { select: { name: true } } },
      orderBy: { summaryDate: 'desc' },
      take: 8,
    })
    return res.json({ success: true, data: summaries })
  } catch (err) {
    console.error('GET fleet-summary error:', err)
    return res.status(500).json({ success: false, error: { code: 'INTERNAL', message: 'Internal server error' } })
  }
})

export default router
