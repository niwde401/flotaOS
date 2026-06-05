import 'dotenv/config'
import http from 'http'
import { Server } from 'socket.io'
import { createApp } from './app'
import { prisma } from './lib/prisma'
import { ensureBucket } from './lib/minio'

const PORT = parseInt(process.env.API_PORT || '3001')

async function main() {
  await prisma.$connect()
  console.log('PostgreSQL connected')

  await ensureBucket()

  const app = createApp()
  const httpServer = http.createServer(app)

  const io = new Server(httpServer, {
    cors: { origin: process.env.WEB_URL || 'http://localhost:3000', credentials: true },
  })

  io.on('connection', (socket) => {
    console.log('WS client connected:', socket.id)
    socket.on('join:zone', (zoneId: string) => socket.join(`zone:${zoneId}`))
    socket.on('join:region', (regionId: string) => socket.join(`region:${regionId}`))
  })

  // Attach io to app for use in routes
  app.set('io', io)

  httpServer.listen(PORT, () => console.log(`API running on port ${PORT}`))
}

main().catch((err) => { console.error(err); process.exit(1) })
