import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { EventType, ForceMajeureType } from '@flotaos/shared'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'

const router = Router({ mergeParams: true })

const createEventSchema = z.object({
  eventType: z.nativeEnum(EventType),
  latitude: z.number(),
  longitude: z.number(),
  notes: z.string().optional(),
  photoUrl: z.string().url().optional(),
  isForceMajeure: z.boolean().optional().default(false),
  fmType: z.nativeEnum(ForceMajeureType).optional(),
  fmPhotos: z.array(z.string().url()).optional(),
  diagnostico: z.string().optional(),
  kmEntrada: z.number().int().optional(),
  kmSalida: z.number().int().optional(),
  trabajosRealizados: z.string().optional(),
})

router.get('/', requireAuth, async (req: Request, res: Response) => {
  const events = await prisma.tripEvent.findMany({
    where: { tripId: req.params.tripId },
    orderBy: { recordedAt: 'asc' },
  })
  return res.json({ success: true, data: events })
})

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const parsed = createEventSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: parsed.error.message } })
  }
  const data = parsed.data
  const tripId = req.params.tripId

  // Validate force majeure requires exactly 3 photos
  if (data.isForceMajeure) {
    if (!data.fmType) {
      return res.status(400).json({ success: false, error: { code: 'FM_VALIDATION', message: 'fmType required for force majeure events' } })
    }
    if (!data.fmPhotos || data.fmPhotos.length !== 3) {
      return res.status(400).json({ success: false, error: { code: 'FM_PHOTOS', message: 'Exactly 3 photos required for force majeure' } })
    }
  }

  // Validate ingreso_taller requires diagnostico and kmEntrada
  if (data.eventType === EventType.ingreso_taller) {
    if (!data.diagnostico || data.kmEntrada === undefined) {
      return res.status(400).json({ success: false, error: { code: 'TALLER_VALIDATION', message: 'diagnostico and kmEntrada required for ingreso_taller' } })
    }
  }

  // Validate salida_taller requires kmSalida and trabajosRealizados
  if (data.eventType === EventType.salida_taller) {
    if (data.kmSalida === undefined || !data.trabajosRealizados) {
      return res.status(400).json({ success: false, error: { code: 'TALLER_VALIDATION', message: 'kmSalida and trabajosRealizados required for salida_taller' } })
    }
  }

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { vehicleId: true, driverId: true, status: true },
  })
  if (!trip) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Trip not found' } })
  }

  // Update trip status on first active event
  if (data.eventType === EventType.llegada_sitio && trip.status === 'scheduled') {
    await prisma.trip.update({ where: { id: tripId }, data: { status: 'active', startedAt: new Date() } })
  }
  if (data.eventType === EventType.llegada_destino) {
    await prisma.trip.update({ where: { id: tripId }, data: { status: 'completed', completedAt: new Date() } })
  }

  const tripEvent = await prisma.tripEvent.create({
    data: {
      tripId,
      vehicleId: trip.vehicleId,
      driverId: trip.driverId,
      eventType: data.eventType,
      latitude: data.latitude,
      longitude: data.longitude,
      photoUrl: data.photoUrl,
      notes: data.notes,
      isForceMajeure: data.isForceMajeure,
      fmType: data.fmType,
      fmPhotos: data.fmPhotos ? data.fmPhotos : undefined,
      diagnostico: data.diagnostico,
      kmEntrada: data.kmEntrada,
      kmSalida: data.kmSalida,
    },
  })

  let ordenTrabajo = null

  // Auto-create OT on ingreso_taller
  if (data.eventType === EventType.ingreso_taller) {
    const count = await prisma.ordenesTrabajo.count()
    ordenTrabajo = await prisma.ordenesTrabajo.create({
      data: {
        vehiculoId: trip.vehicleId,
        tripEventId: tripEvent.id,
        numeroOt: `OT-${String(count + 1).padStart(4, '0')}`,
        fechaProgramada: new Date(),
        status: 'en_taller',
        diagnostico: data.diagnostico,
        kmEntrada: data.kmEntrada,
      },
    })
    await prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'in_maintenance' } })
  }

  // Close OT on salida_taller
  if (data.eventType === EventType.salida_taller) {
    const openOT = await prisma.ordenesTrabajo.findFirst({
      where: { vehiculoId: trip.vehicleId, status: 'en_taller' },
    })
    if (openOT) {
      ordenTrabajo = await prisma.ordenesTrabajo.update({
        where: { id: openOT.id },
        data: {
          status: 'completada',
          fechaCompletada: new Date(),
          kmSalida: data.kmSalida,
          trabajos: data.trabajosRealizados ? { descripcion: data.trabajosRealizados } : undefined,
        },
      })
      await prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'active' } })
    }
  }

  // Emit FM alert via Socket.io
  if (data.isForceMajeure) {
    const io = req.app.get('io')
    if (io) {
      const tripFull = await prisma.trip.findUnique({
        where: { id: tripId },
        include: { team: { include: { zone: true } } },
      })
      const zoneId = tripFull?.team.zone.id
      if (zoneId) {
        io.to(`zone:${zoneId}`).emit('alert:new', {
          type: 'fuerza_mayor',
          tripId,
          eventId: tripEvent.id,
          severity: 'critical',
          fmType: data.fmType,
          ts: new Date().toISOString(),
        })
      }
    }
  }

  return res.status(201).json({ success: true, data: { tripEvent, ordenTrabajo } })
})

export default router
