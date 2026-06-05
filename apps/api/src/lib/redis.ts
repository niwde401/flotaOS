import { Redis } from 'ioredis'

// In dev without Redis, jobs and socket adapter are disabled gracefully
const REDIS_DISABLED = process.env.REDIS_DISABLED === 'true'

class NoopRedis {
  on() { return this }
  disconnect() {}
}

export const redis: Redis = REDIS_DISABLED
  ? (new NoopRedis() as unknown as Redis)
  : new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    })

if (!REDIS_DISABLED) {
  redis.on('error', (err) => console.error('Redis error:', err))
  redis.on('connect', () => console.log('Redis connected'))
} else {
  console.log('Redis disabled (dev mode) — BullMQ jobs skipped')
}
