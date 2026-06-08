import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { minioClient, BUCKET, getSignedUrl } from '../lib/minio'
import { requireAuth } from '../middleware/auth'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) cb(null, true)
    else cb(new Error('Only image files allowed'))
  },
})

router.post('/photo', requireAuth, upload.single('photo'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'photo field required' } })
  }
  const ext = path.extname(req.file.originalname).toLowerCase()
  const objectName = `field-photos/${req.user.userId}/${uuidv4()}${ext}`

  await minioClient.putObject(BUCKET, objectName, req.file.buffer, req.file.size, {
    'Content-Type': req.file.mimetype,
  })

  const signedUrl = await getSignedUrl(objectName, 3600)
  return res.status(201).json({ success: true, data: { url: signedUrl, objectName } })
})

export default router
