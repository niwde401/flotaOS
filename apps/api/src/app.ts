import express from 'express'
import cors from 'cors'
import morgan from 'morgan'

export function createApp() {
  const app = express()

  app.use(cors({ origin: process.env.WEB_URL || 'http://localhost:3000', credentials: true }))
  app.use(express.json({ limit: '10mb' }))
  app.use(morgan('dev'))

  app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }))

  return app
}
