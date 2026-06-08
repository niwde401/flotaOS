import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.get('/accounts', requireAuth, async (req: Request, res: Response) => {
  try {
    const accounts = await prisma.pettyCashAccount.findMany({
      where: { isActive: true },
      include: { region: { select: { name: true, code: true } } },
    })
    return res.json({ success: true, data: accounts })
  } catch (err) {
    console.error('GET accounts error:', err)
    return res.status(500).json({ success: false, error: { code: 'INTERNAL', message: 'Internal server error' } })
  }
})

router.get('/transactions', requireAuth, async (req: Request, res: Response) => {
  try {
    const { regionId, status, page = '1' } = req.query
    const pageNum = parseInt(page as string)
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'page must be a positive integer' } })
    }
    const pageSize = 50

    const where: any = {}
    if (regionId) where.regionId = regionId
    if (status) where.status = status

    const [total, transactions] = await prisma.$transaction([
      prisma.pettyCashTransaction.count({ where }),
      prisma.pettyCashTransaction.findMany({
        where,
        orderBy: { transactionDate: 'desc' },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        include: {
          staff: { select: { fullName: true } },
          region: { select: { name: true } },
        },
      }),
    ])

    return res.json({
      success: true,
      data: transactions,
      meta: { total, page: pageNum, pageSize },
    })
  } catch (err) {
    console.error('GET transactions error:', err)
    return res.status(500).json({ success: false, error: { code: 'INTERNAL', message: 'Internal server error' } })
  }
})

router.post('/batches', requireAuth, async (req: Request, res: Response) => {
  const batchSchema = z.object({
    transactionIds: z.array(z.string().uuid()).min(1),
    batchType: z.string().optional(),
  })
  const parsed = batchSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: parsed.error.message } })
  }
  const { transactionIds, batchType } = parsed.data

  try {
    const staff = await prisma.staff.findUnique({ where: { userId: req.user.userId } })
    if (!staff) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only staff can create batches' } })

    const transactions = await prisma.pettyCashTransaction.findMany({
      where: { id: { in: transactionIds }, status: 'pendiente' },
    })

    if (transactions.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'NO_ELIGIBLE', message: 'No pendiente transactions found for given IDs' } })
    }

    const total = transactions.reduce((s, t) => s + Number(t.amount), 0)
    const now = new Date()
    const batchCode = `LOTE-${staff.regionId.slice(0, 4).toUpperCase()}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`

    const batch = await prisma.reimbursementBatch.create({
      data: {
        batchCode,
        regionId: staff.regionId,
        staffId: staff.id,
        batchType: (batchType || 'weekly') as any,
        totalAmount: total,
        transactionCount: transactions.length,
        status: 'draft',
      },
    })

    await prisma.pettyCashTransaction.updateMany({
      where: { id: { in: transactionIds } },
      data: { status: 'en_reembolso', batchId: batch.id },
    })

    return res.status(201).json({ success: true, data: batch })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Batch code conflict, please retry' } })
    }
    console.error('POST batch error:', err)
    return res.status(500).json({ success: false, error: { code: 'INTERNAL', message: 'Internal server error' } })
  }
})

router.patch('/batches/:id', requireAuth, async (req: Request, res: Response) => {
  const allowedRoles = ['coordinador', 'supervisor', 'asistente', 'director']
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } })
  }
  const { status, paymentReference } = req.body
  try {
    const batch = await prisma.reimbursementBatch.update({
      where: { id: req.params.id },
      data: {
        ...(status !== undefined && { status }),
        ...(paymentReference && { paymentReference }),
        ...(status === 'paid' && { paidAt: new Date() }),
        ...(status === 'submitted' && { submittedAt: new Date() }),
      },
    })
    return res.json({ success: true, data: batch })
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Batch not found' } })
    }
    console.error('PATCH batch error:', err)
    return res.status(500).json({ success: false, error: { code: 'INTERNAL', message: 'Internal server error' } })
  }
})

export default router
