import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: err.errors[0]?.message || err.message } })
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Record not found' } })
    if (err.code === 'P2002') return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Duplicate record' } })
  }
  console.error('Unhandled error:', err)
  return res.status(500).json({ success: false, error: { code: 'INTERNAL', message: 'Internal server error' } })
}
