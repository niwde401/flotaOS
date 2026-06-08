import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.get('/orders', requireAuth, async (req: Request, res: Response) => {
  try {
    const { status, vehicleId } = req.query
    const orders = await prisma.ordenesTrabajo.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(vehicleId && { vehiculoId: vehicleId as string }),
      },
      include: {
        vehiculo: { select: { plateNumber: true, brand: true, model: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return res.json({ success: true, data: orders })
  } catch (err) {
    console.error('GET orders error:', err)
    return res.status(500).json({ success: false, error: { code: 'INTERNAL', message: 'Internal server error' } })
  }
})

router.post('/orders', requireAuth, async (req: Request, res: Response) => {
  try {
    const { vehiculoId, fechaProgramada, urgencia, diagnostico, kmEntrada } = req.body
    if (!vehiculoId || !fechaProgramada) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'vehiculoId and fechaProgramada required' } })
    }
    if (isNaN(Date.parse(fechaProgramada))) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'fechaProgramada must be a valid date' } })
    }
    const count = await prisma.ordenesTrabajo.count()
    const order = await prisma.ordenesTrabajo.create({
      data: {
        vehiculoId,
        numeroOt: `OT-${String(count + 1).padStart(4, '0')}`,
        fechaProgramada: new Date(fechaProgramada),
        urgencia: urgencia || 'normal',
        diagnostico,
        kmEntrada,
      },
    })
    return res.status(201).json({ success: true, data: order })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'OT number conflict, please retry' } })
    }
    if (err?.code === 'P2003') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_VEHICLE', message: 'Vehicle not found' } })
    }
    console.error('POST order error:', err)
    return res.status(500).json({ success: false, error: { code: 'INTERNAL', message: 'Internal server error' } })
  }
})

router.patch('/orders/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { status, taller, costoReal, trabajos, kmSalida } = req.body
    const order = await prisma.ordenesTrabajo.update({
      where: { id: req.params.id },
      data: {
        ...(status !== undefined && { status }),
        ...(taller !== undefined && { taller }),
        ...(costoReal !== undefined && { costoReal }),
        ...(trabajos !== undefined && { trabajos }),
        ...(kmSalida !== undefined && { kmSalida }),
        ...(status === 'completada' && { fechaCompletada: new Date() }),
      },
    })
    return res.json({ success: true, data: order })
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } })
    }
    console.error('PATCH order error:', err)
    return res.status(500).json({ success: false, error: { code: 'INTERNAL', message: 'Internal server error' } })
  }
})

export default router
