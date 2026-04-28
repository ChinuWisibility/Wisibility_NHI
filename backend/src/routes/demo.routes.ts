import { Router } from 'express'
import type { Request, Response } from 'express'
import { db } from '../db/store.js'
import { generateDemoNHIs } from '../services/demo-generator.js'

const router = Router()

// Instantly load 1200 demo NHIs (skips discovery flow — useful for quick demos)
router.post('/load', (_req: Request, res: Response) => {
  const existing  = new Set(db.nhis.map((n) => n.nhiId))
  const generated = generateDemoNHIs(1200)
  const fresh     = generated.filter((n) => !existing.has(n.nhiId))
  db.nhis.push(...fresh)

  const connector = db.connectors.find((c) => c.connectorId === 'conn-demo-01')
  if (connector) connector.lastRunAt = new Date().toISOString()

  res.json({ data: { added: fresh.length, total: db.nhis.length }, message: `${fresh.length} demo NHIs loaded` })
})

// Remove all demo NHIs (ids start with 'demo-nhi-')
router.delete('/reset', (_req: Request, res: Response) => {
  const before = db.nhis.length
  db.nhis = db.nhis.filter((n) => !n.nhiId.startsWith('demo-nhi-'))
  const removed = before - db.nhis.length
  res.json({ data: { removed, remaining: db.nhis.length }, message: `${removed} demo NHIs removed` })
})

export default router
