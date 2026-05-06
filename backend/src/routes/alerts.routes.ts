import { Router } from 'express'
import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  const page     = Math.max(1, parseInt(String(req.query.page  ?? '1'),  10))
  const limit    = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)))
  const severity = req.query.severity as string | undefined
  const status   = req.query.status   as string | undefined
  const nhiId    = req.query.nhiId    as string | undefined

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (severity) where.severity = severity
  if (status)   where.status   = status
  if (nhiId)    where.nhiId    = nhiId

  const [items, total] = await Promise.all([
    prisma.alert.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { detectedAt: 'desc' } }),
    prisma.alert.count({ where }),
  ])
  res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) })
})

router.get('/:alertId', async (req: Request, res: Response) => {
  const alert = await prisma.alert.findUnique({ where: { alertId: req.params.alertId } })
  if (!alert) { res.status(404).json({ error: 'Alert not found' }); return }
  const nhi = await prisma.nhi.findUnique({ where: { nhiId: alert.nhiId } })
  res.json({ data: { ...alert, nhi } })
})

router.post('/:alertId/dismiss', async (req: Request, res: Response) => {
  const alert = await prisma.alert.findUnique({ where: { alertId: req.params.alertId } })
  if (!alert) { res.status(404).json({ error: 'Alert not found' }); return }
  const timeline = [...(alert.timeline as object[]), {
    timestamp:   new Date().toISOString(),
    actor:       req.body.actor ?? 'current-user',
    action:      'DISMISSED',
    note:        req.body.justification ?? '',
  }]
  const updated = await prisma.alert.update({
    where: { alertId: req.params.alertId },
    data:  { status: 'DISMISSED', resolvedAt: new Date(), timeline },
  })
  res.json({ data: updated })
})

router.post('/:alertId/escalate', async (req: Request, res: Response) => {
  const alert = await prisma.alert.findUnique({ where: { alertId: req.params.alertId } })
  if (!alert) { res.status(404).json({ error: 'Alert not found' }); return }
  const timeline = [...(alert.timeline as object[]), {
    timestamp: new Date().toISOString(),
    actor:     req.body.actor ?? 'current-user',
    action:    'ESCALATED',
    note:      req.body.note ?? '',
  }]
  const updated = await prisma.alert.update({
    where: { alertId: req.params.alertId },
    data:  { status: 'ACKNOWLEDGED', assignedTo: req.body.assignedTo ?? null, timeline },
  })
  res.json({ data: updated })
})

export default router
