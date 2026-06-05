import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { vehicleScopeFilter } from '../middleware/scopeFilter'

const router = Router()

router.get('/', requireAuth, async (req: Request, res: Response) => {
  const where = vehicleScopeFilter(req.user)
  const vehicles = await prisma.vehicle.findMany({
    where,
    orderBy: { plateNumber: 'asc' },
    select: {
      id: true, plateNumber: true, brand: true, model: true, year: true,
      vehicleType: true, status: true, fuelType: true, currentKm: true,
    },
  })
  return res.json({ success: true, data: vehicles })
})

router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: req.params.id },
    include: { drivers: { select: { id: true, fullName: true } } },
  })
  if (!vehicle) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Vehicle not found' } })
  return res.json({ success: true, data: vehicle })
})

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const { plateNumber, brand, model, year, vehicleType, fuelType, currentKm } = req.body
  const vehicle = await prisma.vehicle.create({
    data: { plateNumber, brand, model, year, vehicleType, fuelType, currentKm: currentKm || 0 },
  })
  return res.status(201).json({ success: true, data: vehicle })
})

router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  const { status, currentKm } = req.body
  const vehicle = await prisma.vehicle.update({
    where: { id: req.params.id },
    data: { ...(status && { status }), ...(currentKm !== undefined && { currentKm }) },
  })
  return res.json({ success: true, data: vehicle })
})

export default router
