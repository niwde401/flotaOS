import { Router } from 'express'
const router = Router()
router.post('/photo', (_req, res) => res.status(501).json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Plan 2 pending' } }))
export default router
