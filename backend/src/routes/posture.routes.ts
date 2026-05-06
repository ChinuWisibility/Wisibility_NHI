import { Router } from 'express'
import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

router.get('/report', async (_req: Request, res: Response) => {
  const [issues, nhis, connectors] = await Promise.all([
    prisma.postureIssue.findMany({ where: { status: { not: 'REMEDIATED' } } }),
    prisma.nhi.findMany(),
    prisma.connectorConfig.findMany()
  ])

  let score = 100
  for (const i of issues) {
    if      (i.severity === 'CRITICAL') score -= 5
    else if (i.severity === 'HIGH')     score -= 3
    else if (i.severity === 'MEDIUM')   score -= 2
    else                                score -= 1
  }
  score = Math.max(0, score)

  const trend = Array.from({ length: 14 }, (_, idx) => ({
    date:  new Date(Date.now() - (13 - idx) * 86_400_000).toISOString().split('T')[0],
    score: Math.max(0, score + (13 - idx) + (idx % 3 === 0 ? -2 : 1)),
  }))

  const byCategory: Record<string, number> = {}
  for (const i of issues) byCategory[i.issueType] = (byCategory[i.issueType] ?? 0) + 1

  // Discovery Metrics
  const discovery = {
    connectorsCount: connectors.length,
    totalAccounts:   nhis.length,
    byConnector:     Object.entries(
      nhis.reduce((acc, n) => {
        acc[n.sourceConnector] = (acc[n.sourceConnector] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    ).map(([id, count]) => ({ id, count }))
  }

  // Classification Metrics
  const classification = {
    ownership: {
      assigned:   nhis.filter(n => n.ownerId || n.ownerTeam).length,
      unassigned: nhis.filter(n => !n.ownerId && !n.ownerTeam).length
    },
    privilege: {
      admin:    nhis.filter(n => n.privilegeLevel === 'ADMIN').length,
      elevated: nhis.filter(n => n.privilegeLevel === 'ELEVATED').length,
      standard: nhis.filter(n => n.privilegeLevel === 'STANDARD').length,
      readonly: nhis.filter(n => n.privilegeLevel === 'READ_ONLY').length
    },
    breadth: {
      high:   nhis.filter(n => n.breadthScore > 80).length,
      medium: nhis.filter(n => n.breadthScore > 40 && n.breadthScore <= 80).length,
      low:    nhis.filter(n => n.breadthScore <= 40).length
    },
    usage: {
      active:  nhis.filter(n => n.status === 'ACTIVE').length,
      dormant: nhis.filter(n => n.status === 'DORMANT').length,
      pending: nhis.filter(n => n.status === 'PENDING').length
    }
  }

  // Hygiene Metrics
  const hygiene = {
    excessivePermissions: nhis.filter(n => n.privilegeLevel === 'ADMIN' && n.breadthScore < 20).length,
    inactiveAccounts:     nhis.filter(n => n.status === 'DORMANT').length,
    sharedAccounts:       nhis.filter(n => n.isShared).length,
    envSegregation: {
      prod:    nhis.filter(n => n.environment === 'PROD').length,
      nonProd: nhis.filter(n => n.environment !== 'PROD').length
    }
  }

  res.json({
    data: {
      score,
      delta:        score - trend[0].score,
      open:         issues.filter((i) => i.status === 'OPEN').length,
      acknowledged: issues.filter((i) => i.status === 'ACKNOWLEDGED').length,
      trend,
      byCategory:   Object.entries(byCategory).map(([category, count]) => ({ category, count })),
      discovery,
      classification,
      hygiene
    },
  })
})

router.get('/issues/:id', async (req: Request, res: Response) => {
  const issue = await prisma.postureIssue.findUnique({ where: { issueId: req.params.id } })
  if (!issue) { res.status(404).json({ error: 'Issue not found' }); return }
  const nhi = await prisma.nhi.findUnique({ where: { nhiId: issue.nhiId } })
  res.json({ data: { ...issue, nhi } })
})

router.get('/issues', async (req: Request, res: Response) => {
  const page     = Math.max(1, parseInt(String(req.query.page  ?? '1'),  10))
  const limit    = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)))
  const category = req.query.category as string | undefined
  const status   = req.query.status   as string | undefined

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (category) where.issueType = category
  if (status)   where.status    = status

  const [items, total] = await Promise.all([
    prisma.postureIssue.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { detectedAt: 'desc' } }),
    prisma.postureIssue.count({ where }),
  ])
  res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) })
})

router.post('/issues/:issueId/remediate', async (req: Request, res: Response) => {
  const issue = await prisma.postureIssue.findUnique({ where: { issueId: req.params.issueId } })
  if (!issue) { res.status(404).json({ error: 'Issue not found' }); return }
  const updated = await prisma.postureIssue.update({
    where: { issueId: req.params.issueId },
    data:  { status: 'REMEDIATED', remediatedAt: new Date(), remediatedBy: req.body.remediatedBy ?? 'current-user' },
  })
  res.json({ data: updated })
})

export default router
