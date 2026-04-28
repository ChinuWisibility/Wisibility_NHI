import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import type { Request, Response } from 'express'
import { db } from '../db/store.js'
import { generateDemoNHIs } from '../services/demo-generator.js'
import type { ConnectorType, DiscoveryRun } from '../types/index.js'

const router = Router()

function paginate<T>(items: T[], page: number, limit: number) {
  const total      = items.length
  const totalPages = Math.ceil(total / limit)
  const slice      = items.slice((page - 1) * limit, page * limit)
  return { items: slice, total, page, limit, totalPages }
}

router.post('/trigger', (req: Request, res: Response) => {
  const { connectors } = req.body as { connectors: ConnectorType[] | 'ALL' }
  const targetTypes: ConnectorType[] =
    connectors === 'ALL'
      ? db.connectors.filter((c) => c.status === 'ACTIVE').map((c) => c.connectorType)
      : connectors

  const runs: DiscoveryRun[] = targetTypes.map((connectorType) => ({
    runId:          uuid(),
    connectorType,
    status:         'RUNNING',
    startedAt:      new Date().toISOString(),
    nhisDiscovered: 0,
    nhisNew:        0,
    nhisUpdated:    0,
    nhisRemoved:    0,
    errors:         [],
    triggeredBy:    'current-user',
  }))

  for (const run of runs) {
    db.discoveryRuns.unshift(run)

    if (run.connectorType === 'DEMO') {
      // Generate 1200 demo NHIs, skip any that already exist
      setTimeout(() => {
        const existing  = new Set(db.nhis.map((n) => n.nhiId))
        const generated = generateDemoNHIs(1200)
        const fresh     = generated.filter((n) => !existing.has(n.nhiId))
        db.nhis.push(...fresh)

        // Update demo connector last run time
        const connector = db.connectors.find((c) => c.connectorId === 'conn-demo-01')
        if (connector) connector.lastRunAt = new Date().toISOString()

        run.status         = 'COMPLETED'
        run.completedAt    = new Date().toISOString()
        run.nhisDiscovered = generated.length
        run.nhisNew        = fresh.length
        run.nhisUpdated    = generated.length - fresh.length
        run.nhisRemoved    = 0
      }, 2000)
    } else {
      setTimeout(() => {
        run.status         = 'COMPLETED'
        run.completedAt    = new Date().toISOString()
        run.nhisDiscovered = Math.floor(Math.random() * 50) + 10
        run.nhisNew        = Math.floor(Math.random() * 5)
        run.nhisUpdated    = Math.floor(Math.random() * 10)
      }, 3000)
    }
  }

  res.json({ data: { runId: runs[0].runId } })
})

router.get('/runs', (req: Request, res: Response) => {
  const page  = Math.max(1, parseInt(String(req.query.page  ?? '1'),  10))
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)))
  res.json(paginate(db.discoveryRuns, page, limit))
})

router.get('/runs/:runId', (req: Request, res: Response) => {
  const run = db.discoveryRuns.find((r) => r.runId === req.params.runId)
  if (!run) { res.status(404).json({ error: 'Run not found' }); return }
  res.json({ data: run })
})

export default router
