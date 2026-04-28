import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import type { Request, Response } from 'express'
import { db } from '../db/store.js'
import type { ConnectorConfig } from '../types/index.js'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  res.json({ data: db.connectors })
})

router.post('/', (req: Request, res: Response) => {
  const body = req.body as Partial<ConnectorConfig>
  const connector: ConnectorConfig = {
    connectorId:   uuid(),
    connectorType: body.connectorType ?? 'SAAS',
    displayName:   body.displayName   ?? 'New Connector',
    status:        'PENDING',
    config:        body.config        ?? {},
    createdAt:     new Date().toISOString(),
  }
  db.connectors.push(connector)
  res.status(201).json({ data: connector })
})

router.post('/:id/test', (req: Request, res: Response) => {
  const connector = db.connectors.find((c) => c.connectorId === req.params.id)
  if (!connector) { res.status(404).json({ error: 'Connector not found' }); return }

  connector.lastTestAt = new Date().toISOString()
  const succeed = connector.status !== 'ERROR'
  if (succeed) connector.status = 'ACTIVE'

  res.json({
    data: {
      connected:  succeed,
      latencyMs:  succeed ? Math.floor(Math.random() * 80) + 20 : 0,
      error:      succeed ? undefined : 'Connection failed during test',
    },
  })
})

export default router
