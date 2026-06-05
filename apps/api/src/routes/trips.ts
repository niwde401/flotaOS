import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { scopeFilter } from '../middleware/scopeFilter'

const router = Router()

const createTripSchema = z.object({
  teamId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  driverId: z.string().uuid(),
  origin: z.string().min(1),
  destination: z.string().min(1),
  nodeCode: z.string().optional(),
  tripDate: z.string().datetime({ offset: true }).or(z.string().date()),
})

router.get('/', requireAuth, async (req: Request, res: Response) => {
  const scope = scopeFilter(req.user)
  const { date, status } = req.query
  const trips = await prisma.trip.findMany({
    where: {
      ...scope,
      ...(date && { tripDate: new Date(date as string) }),
      ...(status && { status: status as any }),
    },
    include: {
      vehicle: { select: { plateNumber: true, brand: true } },
      driver: { select: { fullName: true } },
      team: { select: { name: true } },
    },
    orderBy: { tripDate: 'desc' },
  })
  return res.json({ success: true, data: trips })
})

router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const trip = await prisma.trip.findUnique({
    where: { id: req.params.id },
    include: {
      vehicle: true,
      driver: { select: { fullName: true, licenseNumber: true } },
      events: { orderBy: { recordedAt: 'asc' } },
    },
  })
  if (!trip) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Trip not found' } })
  return res.json({ success: true, data: trip })
})

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const parsed = createTripSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: parsed.error.message } })
  }
  const trip = await prisma.trip.create({
    data: {
      ...parsed.data,
      tripDate: new Date(parsed.data.tripDate),
      status: 'scheduled',
    },
  })
  return res.status(201).json({ success: true, data: trip })
})

router.patch('/:id/status', requireAuth, async (req: Request, res: Response) => {
  const { status } = req.body
  const trip = await prisma.trip.update({
    where: { id: req.params.id },
    data: {
      status,
      ...(status === 'active' && { startedAt: new Date() }),
      ...(status === 'completed' && { completedAt: new Date() }),
    },
  })
  return res.json({ success: true, data: trip })
})

export default router
