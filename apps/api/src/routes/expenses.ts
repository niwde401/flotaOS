import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { ConceptType } from '@flotaos/shared'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { scopeFilter } from '../middleware/scopeFilter'

const router = Router()

const createExpenseSchema = z.object({
  tripId: z.string().uuid().optional(),
  concept: z.nativeEnum(ConceptType),
  description: z.string().optional(),
  nodeCode: z.string().optional(),
  vehiclePlate: z.string().optional(),
  amount: z.number().positive(),
  voucherType: z.string().optional(),
  voucherNumber: z.string().optional(),
  photoUrl: z.string().url().optional(),
  transactionDate: z.string().date().optional(),
})

router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const scope = scopeFilter(req.user)
    const { status, month } = req.query

    const where: any = { ...scope }
    if (status) where.status = status
    if (month) {
      const [year, m] = (month as string).split('-').map(Number)
      const start = new Date(year, m - 1, 1)
      const end = new Date(year, m, 0)
      where.transactionDate = { gte: start, lte: end }
    }

    const expenses = await prisma.pettyCashTransaction.findMany({
      where,
      orderBy: { transactionDate: 'desc' },
      include: { staff: { select: { fullName: true } }, region: { select: { name: true } } },
    })
    return res.json({ success: true, data: expenses })
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL', message: 'Internal server error' } })
  }
})

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const parsed = createExpenseSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: parsed.error.message } })
  }
  const data = parsed.data

  try {
    const staff = await prisma.staff.findUnique({ where: { userId: req.user.userId } })
    if (!staff) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only staff can create expenses' } })

    const count = await prisma.pettyCashTransaction.count({ where: { regionId: staff.regionId } })

    const expense = await prisma.pettyCashTransaction.create({
      data: {
        seqNumber: count + 1,
        regionId: staff.regionId,
        staffId: staff.id,
        tripId: data.tripId,
        transactionDate: data.transactionDate ? new Date(data.transactionDate) : new Date(),
        concept: data.concept,
        description: data.description,
        nodeCode: data.nodeCode,
        vehiclePlate: data.vehiclePlate,
        amount: data.amount,
        status: data.photoUrl ? 'pendiente' : 'observado',
        voucherType: data.voucherType as any,
        voucherNumber: data.voucherNumber,
        photoUrl: data.photoUrl,
      },
    })

    // Auto-create fuel_record for fuel expenses
    if ([ConceptType.vehicle_fuel, ConceptType.dg_refuel].includes(data.concept) && data.vehiclePlate) {
      const vehicle = await prisma.vehicle.findUnique({ where: { plateNumber: data.vehiclePlate } })
      if (vehicle) {
        await prisma.fuelRecord.create({
          data: {
            vehicleId: vehicle.id,
            driverId: req.user.driverId || '',
            tripId: data.tripId,
            liters: 0,
            totalCost: data.amount,
            kmAtRefuel: vehicle.currentKm,
            receiptPhoto: data.photoUrl,
          },
        })
      }
    }

    return res.status(201).json({ success: true, data: expense })
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL', message: 'Internal server error' } })
  }
})

router.patch('/:id/status', requireAuth, async (req: Request, res: Response) => {
  const { status } = req.body
  try {
    const expense = await prisma.pettyCashTransaction.update({
      where: { id: req.params.id },
      data: { status },
    })
    return res.json({ success: true, data: expense })
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL', message: 'Internal server error' } })
  }
})

export default router
