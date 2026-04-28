import { Router } from 'express'
import type { Request, Response } from 'express'
import { db } from '../db/store.js'
import type { AlertSeverity, AlertStatus } from '../types/index.js'

const router = Router()

function paginate<T>(items: T[], page: number, limit: number) {
  const total      = items.length
  const totalPages = Math.ceil(total / limit)
  const slice     = items.slice((page - 1) * limit, page * limit)
  return { items: slice, total, page, limit, totalPages }
}

router.get('/', (req: Request, res: Response) => {
  const page     = Math.max(1, parseInt(String(req.query.page  ?? '1'),  10))
  const limit    = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)))
  const severity = req.query.severity as AlertSeverity | undefined
  const status   = req.query.status   as AlertStatus   | undefined
  const nhiId    = req.query.nhiId    as string        | undefined

  let items = db.alerts
  if (severity) items = items.filter((a) => a.severity === severity)
  if (status)   items = items.filter((a) => a.status   === status)
  if (nhiId)    items = items.filter((a) => a.nhiId    === nhiId)

  res.json(paginate(items, page, limit))
})

router.post('/:alertId/dismiss', (req: Request, res: Response) => {
  const alert = db.alerts.find((a) => a.alertId === req.params.alertId)
  if (!alert) { res.status(404).json({ error: 'Alert not found' }); return }
  alert.status     = 'DISMISSED'
  alert.resolvedAt = new Date().toISOString()
  alert.timeline.push({
    timestamp: new Date().toISOString(),
    actor:     'current-user',
    action:    'DISMISSED',
    detail:    req.body.justification as string | undefined,
  })
  res.json({ data: null, message: 'Alert dismissed' })
})

router.post('/:alertId/escalate', (req: Request, res: Response) => {
  const alert = db.alerts.find((a) => a.alertId === req.params.alertId)
  if (!alert) { res.status(404).json({ error: 'Alert not found' }); return }
  alert.status = 'ACKNOWLEDGED'
  alert.timeline.push({
    timestamp: new Date().toISOString(),
    actor:     'current-user',
    action:    'ESCALATED',
  })
  res.json({ data: null, message: 'Alert escalated' })
})

export default router
