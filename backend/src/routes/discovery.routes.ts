import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import type { Request, Response } from 'express'
import multer from 'multer'
import { parse } from 'csv-parse/sync'
import { prisma } from '../lib/prisma.js'
import { generateDemoNHIs } from '../services/demo-generator.js'
import { computeRiskScore } from '../services/risk-scorer.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

async function processNHIs(nhis: any[]) {
  const results = []
  for (const n of nhis) {
    const createdAt = n.createdAt || new Date().toISOString()
    const { score, level } = computeRiskScore({
      privilegeLevel: n.privilegeLevel || 'STANDARD',
      breadthScore:   Number(n.breadthScore) || 0,
      createdAt,
      isHardcoded:    String(n.isHardcoded) === 'true',
      isShared:       String(n.isShared) === 'true',
      ownerId:        n.ownerId,
      vaultPath:      n.vaultPath,
      certExpiry:     n.certExpiry,
    })

    const created = await prisma.nhi.upsert({
      where: { nhiId: n.nhiId || uuid() },
      update: {
        ...n,
        breadthScore:   Number(n.breadthScore) || 0,
        isHardcoded:    String(n.isHardcoded) === 'true',
        isShared:       String(n.isShared) === 'true',
        riskScore: score,
        riskLevel: level,
        updatedAt: new Date(),
      },
      create: {
        nhiId:            n.nhiId || uuid(),
        displayName:      n.displayName || 'Unknown NHI',
        nhiType:          n.nhiType || 'API_KEY',
        credentialType:   n.credentialType || 'API_KEY',
        status:           n.status || 'ACTIVE',
        riskScore:        score,
        riskLevel:        level,
        ownerId:          n.ownerId || null,
        ownerTeam:        n.ownerTeam || 'Unknown',
        environment:      n.environment || 'DEV',
        privilegeLevel:   n.privilegeLevel || 'STANDARD',
        breadthScore:     Number(n.breadthScore) || 0,
        isShared:         String(n.isShared) === 'true',
        isHardcoded:      String(n.isHardcoded) === 'true',
        vaultPath:        n.vaultPath || null,
        rotationSchedule: n.rotationSchedule || null,
        certExpiry:       n.certExpiry ? new Date(n.certExpiry) : null,
        lastDiscovered:   new Date(),
        createdAt:        new Date(createdAt),
        sourceConnector:  n.sourceConnector || 'MANUAL',
        tags:             typeof n.tags === 'string' ? JSON.parse(n.tags) : (n.tags || {}),
      },
    })
    results.push(created.nhiId)
  }
  return results
}

router.post('/ingest', upload.single('file'), async (req: Request, res: Response) => {
  try {
    let nhis: any[] = []

    console.log('[Ingest] Request received')
    console.log('[Ingest] File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No file')
    console.log('[Ingest] Body:', JSON.stringify(req.body).slice(0, 100))

    if (req.file) {
      const fileContent = req.file.buffer.toString()
      if (req.file.originalname.endsWith('.csv')) {
        nhis = parse(fileContent, { columns: true, skip_empty_lines: true })
      } else {
        nhis = JSON.parse(fileContent)
      }
    } else {
      nhis = req.body
    }

    if (!Array.isArray(nhis)) {
      console.log('[Ingest] Validation failed: nhis is not an array. Type:', typeof nhis)
      res.status(400).json({ error: 'Payload must be an array of NHIs' })
      return
    }

    console.log(`[Ingest] Processing ${nhis.length} items...`)
    const results = await processNHIs(nhis)
    res.json({ 
      data: {
        message: `Successfully ingested ${results.length} NHIs`, 
        count: results.length 
      }
    })
  } catch (err: any) {
    console.error('[Ingest] Error:', err)
    res.status(500).json({ error: err.message })
  }
})

router.post('/trigger', async (req: Request, res: Response) => {
  const { connectors } = req.body as { connectors: string[] | 'ALL' }

  let targetTypes: string[]
  if (connectors === 'ALL') {
    const active = await prisma.connectorConfig.findMany({ where: { status: 'ACTIVE' }, select: { connectorType: true } })
    targetTypes = active.map((c) => c.connectorType)
  } else {
    targetTypes = connectors
  }

  if (targetTypes.length === 0) {
    res.status(400).json({ error: 'No active connectors to trigger' })
    return
  }

  const firstType = targetTypes[0]
  const run = await prisma.discoveryRun.create({
    data: {
      runId:          uuid(),
      connectorType:  firstType,
      status:         'RUNNING',
      startedAt:      new Date(),
      nhisDiscovered: 0,
      nhisNew:        0,
      nhisUpdated:    0,
      nhisRemoved:    0,
      errors:         [],
      triggeredBy:    'current-user',
    },
  })

  if (firstType === 'DEMO') {
    setTimeout(async () => {
      try {
        const demoNhis = generateDemoNHIs(1200)
        const existing = await prisma.nhi.findMany({
          where:  { nhiId: { in: demoNhis.map((n) => n.nhiId) } },
          select: { nhiId: true },
        })
        const existingSet = new Set(existing.map((n) => n.nhiId))
        const fresh = demoNhis.filter((n) => !existingSet.has(n.nhiId))

        for (const n of fresh) {
          await prisma.nhi.create({
            data: {
              nhiId:            n.nhiId,
              displayName:      n.displayName,
              nhiType:          n.nhiType,
              credentialType:   n.credentialType,
              status:           n.status,
              riskScore:        n.riskScore,
              riskLevel:        n.riskLevel,
              ownerId:          n.ownerId         ?? null,
              ownerTeam:        n.ownerTeam       ?? null,
              environment:      n.environment,
              privilegeLevel:   n.privilegeLevel,
              breadthScore:     n.breadthScore,
              isShared:         n.isShared,
              isHardcoded:      n.isHardcoded,
              vaultPath:        n.vaultPath       ?? null,
              rotationSchedule: n.rotationSchedule ?? null,
              certExpiry:       n.certExpiry ? new Date(n.certExpiry) : null,
              lastDiscovered:   new Date(n.lastDiscovered),
              createdAt:        new Date(n.createdAt),
              sourceConnector:  n.sourceConnector,
              tags:             n.tags as object,
            },
          })
        }

        await prisma.connectorConfig.updateMany({
          where: { connectorType: 'DEMO' },
          data:  { lastRunAt: new Date() },
        })
        await prisma.discoveryRun.update({
          where: { runId: run.runId },
          data:  {
            status:         'COMPLETED',
            completedAt:    new Date(),
            nhisDiscovered: demoNhis.length,
            nhisNew:        fresh.length,
            nhisUpdated:    demoNhis.length - fresh.length,
            nhisRemoved:    0,
          },
        })
      } catch (_e) {
        await prisma.discoveryRun.update({
          where: { runId: run.runId },
          data:  { status: 'FAILED', completedAt: new Date(), errors: ['Demo generation failed'] },
        })
      }
    }, 2000)
  } else {
    setTimeout(async () => {
      await prisma.discoveryRun.update({
        where: { runId: run.runId },
        data:  {
          status:         'COMPLETED',
          completedAt:    new Date(),
          nhisDiscovered: Math.floor(Math.random() * 50) + 10,
          nhisNew:        Math.floor(Math.random() * 5),
          nhisUpdated:    Math.floor(Math.random() * 10),
        },
      })
    }, 3000)
  }

  res.json({ data: { runId: run.runId } })
})

router.get('/runs', async (req: Request, res: Response) => {
  const page  = Math.max(1, parseInt(String(req.query.page  ?? '1'),  10))
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)))
  const [items, total] = await Promise.all([
    prisma.discoveryRun.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { startedAt: 'desc' } }),
    prisma.discoveryRun.count(),
  ])
  res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) })
})

router.get('/runs/:runId', async (req: Request, res: Response) => {
  const run = await prisma.discoveryRun.findUnique({ where: { runId: req.params.runId } })
  if (!run) { res.status(404).json({ error: 'Run not found' }); return }
  res.json({ data: run })
})

export default router
