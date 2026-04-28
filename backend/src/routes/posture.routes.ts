import { Router } from 'express'
import type { Request, Response } from 'express'
import { db } from '../db/store.js'
import type { PostureIssueCategory, PostureIssueSeverity, RemediationStatus } from '../types/index.js'

const router = Router()

function paginate<T>(items: T[], page: number, limit: number) {
  const total      = items.length
  const totalPages = Math.ceil(total / limit)
  const slice     = items.slice((page - 1) * limit, page * limit)
  return { items: slice, total, page, limit, totalPages }
}

router.get('/report', (_req: Request, res: Response) => {
  const openIssues = db.postureIssues.filter((i) => i.status !== 'REMEDIATED')

  const issueCount = {} as Record<PostureIssueCategory, number>
  const cats: PostureIssueCategory[] = [
    'EXCESS_PERMISSIONS', 'STALE_ACCOUNT', 'SHARED_ACCOUNT',
    'ENV_NOT_SEGREGATED', 'PLAINTEXT_FOUND', 'NO_OWNER',
  ]
  for (const cat of cats) {
    issueCount[cat] = openIssues.filter((i) => i.issueType === cat).length
  }

  const sevWeights: Record<PostureIssueSeverity, number> = {
    CRITICAL: 5, HIGH: 3, MEDIUM: 2, LOW: 1,
  }
  const deduction = openIssues.reduce((sum, i) => sum + (sevWeights[i.severity] ?? 0), 0)
  const score     = Math.max(0, 100 - deduction)

  const trend = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    const variance = Math.round((Math.random() - 0.5) * 6)
    return { date: d.toISOString().slice(0, 10), score: Math.min(100, Math.max(0, score + variance)) }
  })
  trend[13].score = score

  res.json({
    data: {
      score,
      scoreDelta: -4,
      issueCount,
      trend,
      generatedAt: new Date().toISOString(),
    },
  })
})

router.get('/issues', (req: Request, res: Response) => {
  const page     = Math.max(1, parseInt(String(req.query.page  ?? '1'),  10))
  const limit    = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)))
  const category = req.query.category as PostureIssueCategory | undefined
  const status   = req.query.status   as RemediationStatus    | undefined

  let items = db.postureIssues
  if (category) items = items.filter((i) => i.issueType === category)
  if (status)   items = items.filter((i) => i.status === status)

  res.json(paginate(items, page, limit))
})

router.post('/issues/:issueId/remediate', (req: Request, res: Response) => {
  const issue = db.postureIssues.find((i) => i.issueId === req.params.issueId)
  if (!issue) { res.status(404).json({ error: 'Issue not found' }); return }
  issue.status      = 'REMEDIATED'
  issue.remediatedAt = new Date().toISOString()
  issue.remediatedBy = 'current-user'
  res.json({ data: null, message: 'Issue marked as remediated' })
})

export default router
