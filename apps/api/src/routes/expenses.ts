import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { ConceptType } from '@flotaos/shared'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'

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
    const { status, month } = req.query

    const where: any = {}
    // scope by role
    if (req.user.role === 'driver') {
      // drivers don't have expenses - return empty
      return res.json({ success: true, data: [] })
    } else if (['coordinador', 'asistente', 'supervisor', 'tecnico'].includes(req.user.role) && req.user.regionId) {
      where.regionId = req.user.regionId
    }
    // director sees all (no filter)
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

    const result = await prisma.$transaction(async (tx) => {
      const count = await tx.pettyCashTransaction.count({ where: { regionId: staff.regionId } })

      const expense = await tx.pettyCashTransaction.create({
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

      if ([ConceptType.vehicle_fuel, ConceptType.dg_refuel].includes(data.concept) && data.vehiclePlate) {
        const vehicle = await tx.vehicle.findUnique({
          where: { plateNumber: data.vehiclePlate },
          include: { drivers: { select: { id: true }, take: 1 } },
        })
        if (vehicle && vehicle.drivers.length > 0) {
          await tx.fuelRecord.create({
            data: {
              vehicleId: vehicle.id,
              driverId: vehicle.drivers[0].id,
              tripId: data.tripId,
              liters: 0,
              totalCost: data.amount,
              kmAtRefuel: vehicle.currentKm,
              receiptPhoto: data.photoUrl,
            },
          })
        }
      }

      return expense
    })

    return res.status(201).json({ success: true, data: result })
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL', message: 'Internal server error' } })
  }
})

router.patch('/:id/status', requireAuth, async (req: Request, res: Response) => {
  const allowedRoles = ['coordinador', 'supervisor', 'asistente', 'director']
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } })
  }

  const validStatuses = ['rendido', 'pendiente', 'pendiente_carga_f', 'en_reembolso', 'inhouse', 'expense_record', 'observado', 'depositado']
  const { status } = req.body
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: `status must be one of: ${validStatuses.join(', ')}` } })
  }

  try {
    // For non-directors, verify region ownership
    if (req.user.role !== 'director' && req.user.regionId) {
      const existing = await prisma.pettyCashTransaction.findUnique({ where: { id: req.params.id } })
      if (!existing) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Expense not found' } })
      }
      if (existing.regionId !== req.user.regionId) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } })
      }
    }

    const expense = await prisma.pettyCashTransaction.update({
      where: { id: req.params.id },
      data: { status },
    })
    return res.json({ success: true, data: expense })
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Expense not found' } })
    }
    console.error('PATCH expense error:', err)
    return res.status(500).json({ success: false, error: { code: 'INTERNAL', message: 'Internal server error' } })
  }
})

export default router
