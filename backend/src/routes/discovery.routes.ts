import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import type { Request, Response } from 'express'
import multer from 'multer'
import { parse } from 'csv-parse/sync'
import { prisma } from '../lib/prisma.js'
import { generateDemoNHIs } from '../services/demo-generator.js'
import { processNHIs } from '../services/nhi-ingest.js'
import { discoverAzureNHIs, parseAzureConfig } from '../services/connectors/azure.connector.js'
import { discoverAwsNHIs, parseAwsConfig } from '../services/connectors/aws.connector.js'
import { discoverOciNHIs, parseOciConfig } from '../services/connectors/oci.connector.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

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

async function persistCloudScan(
  runId: string,
  connector: { connectorId: string },
  source: string,
  result: { nhis: any[]; errors: string[]; findings: { issueId: string; nhiId: string; nhiName: string; issueType: string; severity: string; message: string; ruleId: string }[] },
) {
  const { nhis, errors, findings } = result
  const existing = await prisma.nhi.findMany({
    where:  { nhiId: { in: nhis.map((n) => n.nhiId) } },
    select: { nhiId: true },
  })
  const existingSet = new Set(existing.map((n) => n.nhiId))
  await processNHIs(nhis)
  for (const f of findings) {
    try {
      const prior = await prisma.postureIssue.findUnique({ where: { issueId: f.issueId } })
      await prisma.postureIssue.upsert({
        where: { issueId: f.issueId },
        create: {
          issueId:   f.issueId,
          nhiId:     f.nhiId,
          nhiName:   f.nhiName,
          issueType: f.issueType,
          severity:  f.severity,
          status:    'OPEN',
          details:   { ruleId: f.ruleId, message: f.message, source },
        },
        update: {
          nhiName:  f.nhiName,
          severity: f.severity,
          details:  { ruleId: f.ruleId, message: f.message, source },
          status:   prior?.status === 'ACKNOWLEDGED' || prior?.status === 'REMEDIATED' ? prior.status : 'OPEN',
        },
      })
    } catch (err) {
      errors.push(`Finding ${f.ruleId} for ${f.nhiName} skipped: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  }
  await prisma.connectorConfig.update({
    where: { connectorId: connector.connectorId },
    data:  { lastRunAt: new Date(), status: errors.length && nhis.length === 0 ? 'ERROR' : 'ACTIVE' },
  })
  await prisma.discoveryRun.update({
    where: { runId },
    data:  {
      status:         errors.length && nhis.length === 0 ? 'FAILED' : 'COMPLETED',
      completedAt:    new Date(),
      nhisDiscovered: nhis.length,
      nhisNew:        nhis.filter((n) => !existingSet.has(n.nhiId)).length,
      nhisUpdated:    nhis.filter((n) => existingSet.has(n.nhiId)).length,
      nhisRemoved:    0,
      errors,
    },
  })
}

async function runAzureDiscovery(runId: string, connector: { connectorId: string; connectorType: string; config: unknown }) {
  try {
    await persistCloudScan(runId, connector, 'azure-connector', await discoverAzureNHIs(connector.config, connector.connectorId))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Azure discovery failed'
    await prisma.connectorConfig.update({
      where: { connectorId: connector.connectorId },
      data:  { status: 'ERROR' },
    }).catch(() => undefined)
    await prisma.discoveryRun.update({
      where: { runId },
      data:  { status: 'FAILED', completedAt: new Date(), errors: [message] },
    })
  }
}

async function runAwsDiscovery(runId: string, connector: { connectorId: string; connectorType: string; config: unknown }) {
  try {
    await persistCloudScan(runId, connector, 'aws-connector', await discoverAwsNHIs(connector.config, connector.connectorId))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AWS discovery failed'
    await prisma.connectorConfig.update({
      where: { connectorId: connector.connectorId },
      data:  { status: 'ERROR' },
    }).catch(() => undefined)
    await prisma.discoveryRun.update({
      where: { runId },
      data:  { status: 'FAILED', completedAt: new Date(), errors: [message] },
    })
  }
}

async function runOciDiscovery(runId: string, connector: { connectorId: string; connectorType: string; config: unknown }) {
  try {
    await persistCloudScan(runId, connector, 'oci-connector', await discoverOciNHIs(connector.config, connector.connectorId))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'OCI discovery failed'
    await prisma.connectorConfig.update({
      where: { connectorId: connector.connectorId },
      data:  { status: 'ERROR' },
    }).catch(() => undefined)
    await prisma.discoveryRun.update({
      where: { runId },
      data:  { status: 'FAILED', completedAt: new Date(), errors: [message] },
    })
  }
}

router.post('/trigger', async (req: Request, res: Response) => {
  const { connectors, connectorId } = req.body as {
    connectors?: string[] | 'ALL'
    connectorId?: string
  }

  let targets = await prisma.connectorConfig.findMany({
    where: connectorId
      ? { connectorId }
      : connectors === 'ALL'
        ? { status: { in: ['ACTIVE', 'PENDING'] } }
        : Array.isArray(connectors) && connectors.length
          ? { connectorType: { in: connectors } }
          : { status: 'ACTIVE' },
  })

  if (targets.length === 0) {
    res.status(400).json({ error: 'No matching connectors to trigger' })
    return
  }

  const runs = []
  for (const connector of targets) {
    const run = await prisma.discoveryRun.create({
      data: {
        runId:          uuid(),
        connectorId:    connector.connectorId,
        connectorType:  connector.connectorType,
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
    runs.push(run)

    if (connector.connectorType === 'CLOUD_AZURE' && parseAzureConfig(connector.config)) {
      setTimeout(() => { void runAzureDiscovery(run.runId, connector) }, 50)
    } else if (connector.connectorType === 'CLOUD_AWS' && parseAwsConfig(connector.config)) {
      setTimeout(() => { void runAwsDiscovery(run.runId, connector) }, 50)
    } else if (connector.connectorType === 'CLOUD_OCI' && parseOciConfig(connector.config)) {
      setTimeout(() => { void runOciDiscovery(run.runId, connector) }, 50)
    } else if (connector.connectorType === 'DEMO') {
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

          await prisma.connectorConfig.update({
            where: { connectorId: connector.connectorId },
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
    } else if (connector.connectorType === 'CLOUD_AZURE') {
      setTimeout(async () => {
        await prisma.discoveryRun.update({
          where: { runId: run.runId },
          data:  {
            status:      'FAILED',
            completedAt: new Date(),
            errors:      ['Add Tenant ID, Client ID, and Client Secret on this Azure connector, then Test and scan again.'],
          },
        })
      }, 200)
    } else if (connector.connectorType === 'CLOUD_AWS') {
      setTimeout(async () => {
        await prisma.discoveryRun.update({
          where: { runId: run.runId },
          data:  {
            status:      'FAILED',
            completedAt: new Date(),
            errors:      ['Add Access Key ID, Secret Access Key, and Region on this AWS connector, then Test and scan again.'],
          },
        })
      }, 200)
    } else if (connector.connectorType === 'CLOUD_OCI') {
      setTimeout(async () => {
        await prisma.discoveryRun.update({
          where: { runId: run.runId },
          data:  {
            status:      'FAILED',
            completedAt: new Date(),
            errors:      ['Add Tenancy OCID, User OCID, fingerprint, API private key, and home region on this OCI connector, then Test and scan again.'],
          },
        })
      }, 200)
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
  }

  res.json({ data: { runId: runs[0].runId, runIds: runs.map((r) => r.runId) } })
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
