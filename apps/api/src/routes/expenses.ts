import { Router } from 'express'
const router = Router()
router.get('/', (_req, res) => res.status(501).json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Plan 2 pending' } }))
router.post('/', (_req, res) => res.status(501).json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Plan 2 pending' } }))
export default router
