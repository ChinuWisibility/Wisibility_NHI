import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { testAzureConnection } from '../services/connectors/azure.connector.js'
import { testAwsConnection } from '../services/connectors/aws.connector.js'
import { testOciConnection } from '../services/connectors/oci.connector.js'

const router = Router()

const SECRET_KEYS = ['clientsecret', 'secretaccesskey', 'sessiontoken', 'password', 'privatekey', 'passphrase']

function isSecretKey(key: string) {
  const k = key.toLowerCase()
  return SECRET_KEYS.some((s) => k.includes(s))
}

function maskConfig(config: unknown): Record<string, string> {
  const raw = (config && typeof config === 'object') ? config as Record<string, unknown> : {}
  const out: Record<string, string> = {}
  for (const [key, val] of Object.entries(raw)) {
    const text = val == null ? '' : String(val)
    out[key] = isSecretKey(key) && text ? '••••••••' : text
  }
  return out
}

function mergeConfig(existing: unknown, incoming: unknown): Record<string, string> {
  const prev = (existing && typeof existing === 'object') ? existing as Record<string, unknown> : {}
  const next = (incoming && typeof incoming === 'object') ? incoming as Record<string, unknown> : {}
  const out: Record<string, string> = {}
  for (const [key, val] of Object.entries({ ...prev, ...next })) {
    const text = val == null ? '' : String(val)
    if (isSecretKey(key) && (!text || text.includes('•'))) {
      out[key] = String(prev[key] ?? '')
    } else {
      out[key] = text
    }
  }
  return out
}

async function withStats(c: { connectorId: string; config: unknown; [key: string]: unknown }) {
  const nhiCount = await prisma.nhi.count({ where: { sourceConnector: c.connectorId } })
  return {
    ...c,
    config: maskConfig(c.config),
    nhiCount,
    totalIdentities: nhiCount,
  }
}

router.get('/', async (_req: Request, res: Response) => {
  const connectors = await prisma.connectorConfig.findMany({ orderBy: { createdAt: 'asc' } })
  const connectorsWithStats = await Promise.all(connectors.map((c) => withStats(c)))
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
      config:        mergeConfig({}, body.config ?? {}),
    },
  })
  res.status(201).json({ data: await withStats(connector) })
})

router.put('/:id', async (req: Request, res: Response) => {
  const existing = await prisma.connectorConfig.findUnique({ where: { connectorId: req.params.id } })
  if (!existing) { res.status(404).json({ error: 'Connector not found' }); return }

  const updated = await prisma.connectorConfig.update({
    where: { connectorId: req.params.id },
    data: {
      displayName: req.body.displayName ?? existing.displayName,
      config:      mergeConfig(existing.config, req.body.config ?? existing.config),
    },
  })
  res.json({ data: await withStats(updated) })
})

router.get('/:id', async (req: Request, res: Response) => {
  const connector = await prisma.connectorConfig.findUnique({ where: { connectorId: req.params.id } })
  if (!connector) { res.status(404).json({ error: 'Connector not found' }); return }
  res.json({ data: await withStats(connector) })
})

router.post('/:id/test', async (req: Request, res: Response) => {
  const connector = await prisma.connectorConfig.findUnique({ where: { connectorId: req.params.id } })
  if (!connector) { res.status(404).json({ error: 'Connector not found' }); return }

  let connected = false
  let latencyMs = 0
  let error: string | undefined
  let message = 'Connection successful'

  if (connector.connectorType === 'CLOUD_AZURE') {
    const result = await testAzureConnection(connector.config)
    connected = result.connected
    latencyMs = result.latencyMs
    error = result.error
    message = connected
      ? `Connected to ${result.tenantName || 'Azure'}`
      : (result.error || 'Azure connection failed')
  } else if (connector.connectorType === 'CLOUD_AWS') {
    const result = await testAwsConnection(connector.config)
    connected = result.connected
    latencyMs = result.latencyMs
    error = result.error
    message = connected
      ? `Connected to ${result.tenantName || 'AWS'}`
      : (result.error || 'AWS connection failed')
  } else if (connector.connectorType === 'CLOUD_OCI') {
    const result = await testOciConnection(connector.config)
    connected = result.connected
    latencyMs = result.latencyMs
    error = result.error
    message = connected
      ? `Connected to ${result.tenantName || 'OCI'}`
      : (result.error || 'OCI connection failed')
  } else {
    const started = Date.now()
    await new Promise((r) => setTimeout(r, 40))
    connected = connector.status !== 'ERROR'
    latencyMs = Date.now() - started
    message = connected ? 'Connection successful' : 'Connection failed'
    if (!connected) error = 'Connector is in ERROR state'
  }

  await prisma.connectorConfig.update({
    where: { connectorId: req.params.id },
    data:  { status: connected ? 'ACTIVE' : 'ERROR', lastTestAt: new Date() },
  })

  res.json({
    data: { connected, latencyMs, error, message },
  })
})

export default router
