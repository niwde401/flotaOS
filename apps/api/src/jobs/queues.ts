import { Queue } from 'bullmq'
import { redis } from '../lib/redis'

const REDIS_DISABLED = process.env.REDIS_DISABLED === 'true'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const kpiQueue = REDIS_DISABLED ? null : new Queue('kpi-snapshots', { connection: redis as any })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const alertQueue = REDIS_DISABLED ? null : new Queue('doc-alerts', { connection: redis as any })
