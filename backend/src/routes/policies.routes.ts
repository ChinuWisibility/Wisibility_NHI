import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

interface PolicyFilters {
  nhiType?:     string[]
  riskLevel?:   string[]
  environment?: string[]
  ownerTeam?:   string[]
}

async function computeAffectedCount(filters: PolicyFilters): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (filters.nhiType?.length)     where.nhiType     = { in: filters.nhiType }
  if (filters.riskLevel?.length)   where.riskLevel   = { in: filters.riskLevel }
  if (filters.environment?.length) where.environment = { in: filters.environment }
  if (filters.ownerTeam?.length)   where.ownerTeam   = { in: filters.ownerTeam }
  return prisma.nhi.count({ where })
}

router.get('/', async (_req: Request, res: Response) => {
  const policies = await prisma.policy.findMany({ orderBy: { createdAt: 'asc' } })
  const withCounts = await Promise.all(
    policies.map(async (p) => ({
      ...p,
      affectedCount: await computeAffectedCount(p.filters as PolicyFilters),
    })),
  )
  res.json({ data: withCounts })
})

router.get('/:id', async (req: Request, res: Response) => {
  const policy = await prisma.policy.findUnique({ where: { policyId: req.params.id } })
  if (!policy) { res.status(404).json({ error: 'Policy not found' }); return }
  const affectedCount = await computeAffectedCount(policy.filters as PolicyFilters)
  res.json({ data: { ...policy, affectedCount } })
})

router.post('/', async (req: Request, res: Response) => {
  const body = req.body
  const policy = await prisma.policy.create({
    data: {
      policyId:    uuid(),
      name:        body.name        ?? 'New Policy',
      description: body.description ?? '',
      enabled:     body.enabled     ?? true,
      filters:     body.filters     ?? {},
      action:      body.action      ?? 'ALERT',
      createdBy:   body.createdBy   ?? 'current-user',
    },
  })
  const affectedCount = await computeAffectedCount(policy.filters as PolicyFilters)
  res.status(201).json({ data: { ...policy, affectedCount } })
})

router.put('/:id', async (req: Request, res: Response) => {
  const existing = await prisma.policy.findUnique({ where: { policyId: req.params.id } })
  if (!existing) { res.status(404).json({ error: 'Policy not found' }); return }
  const policy = await prisma.policy.update({
    where: { policyId: req.params.id },
    data:  {
      name:        req.body.name        ?? existing.name,
      description: req.body.description ?? existing.description,
      enabled:     req.body.enabled     ?? existing.enabled,
      filters:     req.body.filters     ?? existing.filters,
      action:      req.body.action      ?? existing.action,
    },
  })
  const affectedCount = await computeAffectedCount(policy.filters as PolicyFilters)
  res.json({ data: { ...policy, affectedCount } })
})

router.delete('/:id', async (req: Request, res: Response) => {
  const existing = await prisma.policy.findUnique({ where: { policyId: req.params.id } })
  if (!existing) { res.status(404).json({ error: 'Policy not found' }); return }
  await prisma.policy.delete({ where: { policyId: req.params.id } })
  res.json({ data: null, message: 'Policy deleted' })
})

router.post('/preview', async (req: Request, res: Response) => {
  const filters: PolicyFilters = req.body.filters ?? {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (filters.nhiType?.length)     where.nhiType     = { in: filters.nhiType }
  if (filters.riskLevel?.length)   where.riskLevel   = { in: filters.riskLevel }
  if (filters.environment?.length) where.environment = { in: filters.environment }
  if (filters.ownerTeam?.length)   where.ownerTeam   = { in: filters.ownerTeam }
  const [nhis, count] = await Promise.all([
    prisma.nhi.findMany({ where, take: 10, orderBy: { riskScore: 'desc' } }),
    prisma.nhi.count({ where }),
  ])
  res.json({ data: { count, sample: nhis } })
})

export default router
