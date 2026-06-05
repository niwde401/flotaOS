import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.get('/', requireAuth, async (req: Request, res: Response) => {
  const { date } = req.query
  const teams = await prisma.team.findMany({
    where: {
      isActive: true,
      ...(date && { tripDate: new Date(date as string) }),
    },
    include: {
      vehicle: { select: { id: true, plateNumber: true, brand: true } },
      zone: { select: { id: true, name: true } },
      region: { select: { id: true, name: true } },
      _count: { select: { members: true } },
    },
    orderBy: { name: 'asc' },
  })
  return res.json({ success: true, data: teams })
})

router.get('/:id/members', requireAuth, async (req: Request, res: Response) => {
  const members = await prisma.teamMember.findMany({
    where: { teamId: req.params.id, leftAt: null },
    include: {
      staff: { select: { id: true, fullName: true, role: true, email: true } },
    },
  })
  return res.json({ success: true, data: members })
})

export default router
