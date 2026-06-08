import { kpiQueue, alertQueue } from './queues'
import './workers/kpi.worker'
import './workers/alert.worker'

const REDIS_DISABLED = process.env.REDIS_DISABLED === 'true'

export async function startScheduler() {
  if (REDIS_DISABLED) {
    console.log('BullMQ scheduler skipped (Redis disabled in dev mode)')
    return
  }

  await kpiQueue!.add('daily-kpi', {}, {
    repeat: { pattern: '0 23 * * *' },
    removeOnComplete: 50,
    removeOnFail: 20,
  })

  await alertQueue!.add('doc-alerts', {}, {
    repeat: { pattern: '0 0 * * *' },
    removeOnComplete: 50,
    removeOnFail: 20,
  })

  console.log('BullMQ scheduler started — jobs: daily-kpi (23:00), doc-alerts (00:00)')
}
