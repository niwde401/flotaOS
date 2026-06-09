import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import authRouter from './routes/auth'
import vehiclesRouter from './routes/vehicles'
import teamsRouter from './routes/teams'
import tripsRouter from './routes/trips'
import tripEventsRouter from './routes/tripEvents'
import uploadsRouter from './routes/uploads'
import expensesRouter from './routes/expenses'
import maintenanceRouter from './routes/maintenance'
import kpisRouter from './routes/kpis'
import pettyCashRouter from './routes/pettyCash'
import { errorHandler } from './middleware/errorHandler'

export function createApp() {
  const app = express()

  app.use(cors({ origin: process.env.WEB_URL || 'http://localhost:3000', credentials: true }))
  app.use(express.json({ limit: '10mb' }))
  app.use(morgan('dev'))

  app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }))

  app.use('/auth', authRouter)
  app.use('/api/vehicles', vehiclesRouter)
  app.use('/api/teams', teamsRouter)
  app.use('/api/trips', tripsRouter)
  app.use('/api/trips/:tripId/events', tripEventsRouter)
  app.use('/api/uploads', uploadsRouter)
  app.use('/api/expenses', expensesRouter)
  app.use('/api/maintenance', maintenanceRouter)
  app.use('/api/kpis', kpisRouter)
  app.use('/api/petty-cash', pettyCashRouter)

  app.use(errorHandler)

  return app
}
