import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  const connectors = await prisma.connectorConfig.findMany({ orderBy: { createdAt: 'asc' } })

  // For each connector, get the count of NHIs
  const connectorsWithStats = await Promise.all(connectors.map(async (c) => {
    const nhiCount = await prisma.nhi.count({
      where: { sourceConnector: c.connectorId }
    })

    // If no NHIs found by ID, try by type or displayName if they match the demo pattern
    // In demo data, sourceConnector is like 'conn-ad-01' which matches connectorId
    
    // Simulate total identities scanned (human + non-human)
    // For demo purposes, we'll say total = nhiCount + some random human users
    const totalIdentities = nhiCount > 0 ? nhiCount + Math.floor(Math.random() * 500) + 100 : 0

    return {
      ...c,
      nhiCount,
      totalIdentities
    }
  }))

  res.json({ data: connectorsWithStats })
})

router.post('/', async (req: Request, res: Response) => {
  const body = req.body
  const connector = await prisma.connectorConfig.create({
    data: {
      connectorId:   uuid(),
      connectorType: body.connectorType ?? 'SAAS',
      displayName:   body.displayName   ?? 'New Connector',
      status:        'PENDING',
      config:        body.config        ?? {},
    },
  })
  res.status(201).json({ data: connector })
})

router.get('/:id', async (req: Request, res: Response) => {
  const connector = await prisma.connectorConfig.findUnique({ where: { connectorId: req.params.id } })
  if (!connector) { res.status(404).json({ error: 'Connector not found' }); return }

  const nhiCount = await prisma.nhi.count({
    where: { sourceConnector: connector.connectorId }
  })
  const totalIdentities = nhiCount > 0 ? nhiCount + Math.floor(Math.random() * 500) + 100 : 0

  res.json({ 
    data: { 
      ...connector, 
      nhiCount, 
      totalIdentities 
    } 
  })
})

router.post('/:id/test', async (req: Request, res: Response) => {
  const connector = await prisma.connectorConfig.findUnique({ where: { connectorId: req.params.id } })
  if (!connector) { res.status(404).json({ error: 'Connector not found' }); return }

  // Simulate connectivity test
  const latencyMs = Math.floor(Math.random() * 60) + 20
  await new Promise((r) => setTimeout(r, latencyMs))
  const success = connector.status !== 'ERROR' || Math.random() > 0.3

  const updated = await prisma.connectorConfig.update({
    where: { connectorId: req.params.id },
    data:  { status: success ? 'ACTIVE' : 'ERROR', lastTestAt: new Date() },
  })
  res.json({
    data: {
      connectorId: updated.connectorId,
      status:      updated.status,
      latencyMs,
      message:     success ? 'Connection successful' : 'Connection failed',
    },
  })
})

export default router
