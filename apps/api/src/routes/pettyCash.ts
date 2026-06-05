import { Router } from 'express'
const router = Router()
router.get('/accounts', (_req, res) => res.status(501).json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Plan 2 pending' } }))
router.get('/transactions', (_req, res) => res.status(501).json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Plan 2 pending' } }))
router.post('/batches', (_req, res) => res.status(501).json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Plan 2 pending' } }))
export default router
