import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { UserContext } from '@flotaos/shared'

const router = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

function signAccess(ctx: UserContext): string {
  return jwt.sign(ctx, process.env.JWT_SECRET!, { expiresIn: '15m' })
}

function signRefresh(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' })
}

router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: parsed.error.message } })
  }
  const { email, password } = parsed.data
  const user = await prisma.user.findUnique({
    where: { email },
    include: { staff: true, driver: true },
  })
  if (!user || !user.isActive) {
    return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } })
  }
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } })
  }

  const ctx: UserContext = {
    userId: user.id,
    role: user.role as any,
    staffId: user.staff?.id,
    driverId: user.driver?.id,
    teamId: user.staff?.teamId ?? undefined,
    zoneId: undefined,
    regionId: user.staff?.regionId,
  }

  const accessToken = signAccess(ctx)
  const refreshToken = signRefresh(user.id)

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  return res.json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role, fullName: user.staff?.fullName || user.driver?.fullName || user.email },
    },
  })
})

router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body
  if (!refreshToken) {
    return res.status(400).json({ success: false, error: { code: 'MISSING_TOKEN', message: 'Refresh token required' } })
  }
  let payload: { userId: string }
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string }
  } catch {
    return res.status(401).json({ success: false, error: { code: 'TOKEN_INVALID', message: 'Invalid refresh token' } })
  }
  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } })
  if (!stored || stored.expiresAt < new Date()) {
    return res.status(401).json({ success: false, error: { code: 'TOKEN_EXPIRED', message: 'Refresh token expired' } })
  }
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { staff: true, driver: true },
  })
  if (!user) {
    return res.status(401).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } })
  }
  const ctx: UserContext = {
    userId: user.id,
    role: user.role as any,
    staffId: user.staff?.id,
    driverId: user.driver?.id,
    teamId: user.staff?.teamId ?? undefined,
    regionId: user.staff?.regionId,
  }
  return res.json({ success: true, data: { accessToken: signAccess(ctx) } })
})

router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  const { refreshToken } = req.body
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
  }
  return res.json({ success: true })
})

export default router
