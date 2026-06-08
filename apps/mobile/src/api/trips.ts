import { apiClient } from './client'
import { TripDTO, CreateTripDTO, CreateEventDTO, TripEventDTO } from '@flotaos/shared'

export const tripsApi = {
  list: async (date?: string) => {
    const res = await apiClient.get('/api/trips', { params: { date } })
    return res.data.data as TripDTO[]
  },

  create: async (dto: CreateTripDTO) => {
    const res = await apiClient.post('/api/trips', dto)
    return res.data.data as TripDTO
  },

  get: async (id: string) => {
    const res = await apiClient.get(`/api/trips/${id}`)
    return res.data.data as TripDTO
  },

  createEvent: async (tripId: string, dto: CreateEventDTO) => {
    const res = await apiClient.post(`/api/trips/${tripId}/events`, dto)
    return res.data.data
  },

  getEvents: async (tripId: string) => {
    const res = await apiClient.get(`/api/trips/${tripId}/events`)
    return res.data.data as TripEventDTO[]
  },
}
