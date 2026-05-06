import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { computeRiskScore } from '../services/risk-scorer.js'

const router = Router()

router.get('/summary', async (_req: Request, res: Response) => {
  const nhis = await prisma.nhi.findMany()
  const byStatus: Record<string, number> = {}
  const byRisk:   Record<string, number> = {}
  const byEnv:    Record<string, number> = {}
  const byType:   Record<string, number> = {}
  const teams = new Set<string>()
  for (const n of nhis) {
    byStatus[n.status]      = (byStatus[n.status]      ?? 0) + 1
    byRisk[n.riskLevel]     = (byRisk[n.riskLevel]     ?? 0) + 1
    byEnv[n.environment]    = (byEnv[n.environment]    ?? 0) + 1
    byType[n.nhiType]       = (byType[n.nhiType]       ?? 0) + 1
    if (n.ownerTeam) teams.add(n.ownerTeam)
  }
  const active = nhis.filter((n) => n.status === 'ACTIVE')
  res.json({
    data: {
      total:         nhis.length,
      byStatus,
      byRisk,
      byEnvironment: byEnv,
      byType,
      hardcoded:     active.filter((n) => n.isHardcoded).length,
      shared:        active.filter((n) => n.isShared).length,
      noVault:       active.filter((n) => !n.vaultPath).length,
      inVault:       nhis.filter((n) => !!n.vaultPath).length,
      teamsCount:    teams.size,
    },
  })
})

router.get('/', async (req: Request, res: Response) => {
  const page  = Math.max(1, parseInt(String(req.query.page  ?? '1'),  10))
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)))
  const q          = String(req.query.q         ?? '').toLowerCase()
  const riskLevel  = req.query.riskLevel   as string | undefined
  const env        = req.query.environment as string | undefined
  const nhiType    = req.query.nhiType     as string | undefined
  const status     = req.query.status      as string | undefined
  const ownerId    = req.query.ownerId     as string | undefined
  const sourceConnector = req.query.sourceConnector as string | undefined

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (q)        where.displayName = { contains: q, mode: 'insensitive' }
  if (riskLevel) where.riskLevel  = riskLevel
  if (env)       where.environment = env
  if (nhiType)   where.nhiType    = nhiType
  if (status)    where.status     = status
  if (ownerId)   where.ownerId    = ownerId
  if (sourceConnector) where.sourceConnector = sourceConnector

  const [items, total] = await Promise.all([
    prisma.nhi.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { riskScore: 'desc' } }),
    prisma.nhi.count({ where }),
  ])
  res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) })
})

router.get('/:id', async (req: Request, res: Response) => {
  const nhi = await prisma.nhi.findUnique({ where: { nhiId: req.params.id } })
  if (!nhi) { res.status(404).json({ error: 'NHI not found' }); return }
  res.json({ data: nhi })
})

router.post('/', async (req: Request, res: Response) => {
  const body = req.body
  const now  = new Date()
  const { score, level } = computeRiskScore({
    privilegeLevel: body.privilegeLevel ?? 'STANDARD',
    breadthScore:   body.breadthScore   ?? 0,
    createdAt:      now.toISOString(),
    isHardcoded:    body.isHardcoded    ?? false,
    isShared:       body.isShared       ?? false,
    ownerId:        body.ownerId,
    certExpiry:     body.certExpiry,
    vaultPath:      body.vaultPath,
  })
  const nhi = await prisma.nhi.create({
    data: {
      nhiId:            uuid(),
      displayName:      body.displayName     ?? 'Unnamed NHI',
      nhiType:          body.nhiType         ?? 'SERVICE_ACCOUNT',
      credentialType:   body.credentialType  ?? 'PASSWORD',
      status:           body.status          ?? 'PENDING',
      riskScore:        score,
      riskLevel:        level,
      ownerId:          body.ownerId         ?? null,
      ownerTeam:        body.ownerTeam       ?? null,
      environment:      body.environment     ?? 'DEV',
      privilegeLevel:   body.privilegeLevel  ?? 'STANDARD',
      breadthScore:     body.breadthScore    ?? 0,
      isShared:         body.isShared        ?? false,
      isHardcoded:      body.isHardcoded     ?? false,
      vaultPath:        body.vaultPath       ?? null,
      rotationSchedule: body.rotationSchedule ?? null,
      certExpiry:       body.certExpiry ? new Date(body.certExpiry) : null,
      lastDiscovered:   now,
      createdAt:        now,
      sourceConnector:  body.sourceConnector ?? 'manual',
      tags:             body.tags            ?? {},
    },
  })
  res.status(201).json({ data: nhi })
})

router.put('/:id', async (req: Request, res: Response) => {
  const existing = await prisma.nhi.findUnique({ where: { nhiId: req.params.id } })
  if (!existing) { res.status(404).json({ error: 'NHI not found' }); return }
  const { score, level } = computeRiskScore({
    privilegeLevel: req.body.privilegeLevel ?? existing.privilegeLevel,
    breadthScore:   req.body.breadthScore   ?? existing.breadthScore,
    createdAt:      existing.createdAt.toISOString(),
    isHardcoded:    req.body.isHardcoded    ?? existing.isHardcoded,
    isShared:       req.body.isShared       ?? existing.isShared,
    ownerId:        req.body.ownerId        ?? existing.ownerId ?? undefined,
    certExpiry:     req.body.certExpiry     ?? existing.certExpiry?.toISOString(),
    vaultPath:      req.body.vaultPath      ?? existing.vaultPath ?? undefined,
  })
  const nhi = await prisma.nhi.update({
    where: { nhiId: req.params.id },
    data:  { ...req.body, riskScore: score, riskLevel: level },
  })
  res.json({ data: nhi })
})

router.delete('/:id', async (req: Request, res: Response) => {
  const existing = await prisma.nhi.findUnique({ where: { nhiId: req.params.id } })
  if (!existing) { res.status(404).json({ error: 'NHI not found' }); return }
  await prisma.nhi.update({ where: { nhiId: req.params.id }, data: { status: 'ARCHIVED' } })
  res.json({ data: null, message: 'NHI archived' })
})

export default router
