import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import type { Request, Response } from 'express'
import { db } from '../db/store.js'
import type {
  CertificationCampaign, CertificationDecisionRecord,
  RegulatoryFramework,
} from '../types/index.js'

const router = Router()

router.get('/score', (_req: Request, res: Response) => {
  res.json({ data: db.complianceScores })
})

router.post('/export/:framework', (req: Request, res: Response) => {
  const framework = req.params.framework as RegulatoryFramework
  res.json({ data: { url: `/exports/${framework.toLowerCase()}-evidence-${Date.now()}.zip` } })
})

router.get('/campaigns', (_req: Request, res: Response) => {
  res.json({ data: db.certCampaigns })
})

router.post('/campaigns', (req: Request, res: Response) => {
  const body = req.body as Partial<CertificationCampaign>
  const campaign: CertificationCampaign = {
    campaignId: uuid(),
    name:       body.name       ?? 'New Campaign',
    framework:  body.framework  ?? 'SOC2',
    status:     'DRAFT',
    nhiScope:   body.nhiScope   ?? [],
    certifiers: body.certifiers ?? [],
    dueDate:    body.dueDate    ?? new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
    createdAt:  new Date().toISOString(),
    decisions:  0,
    pending:    (body.nhiScope ?? []).length,
  }
  db.certCampaigns.push(campaign)
  res.status(201).json({ data: campaign })
})

router.post('/:campaignId/decisions', (req: Request, res: Response) => {
  const campaign = db.certCampaigns.find((c) => c.campaignId === req.params.campaignId)
  if (!campaign) { res.status(404).json({ error: 'Campaign not found' }); return }

  const decisions = req.body as Omit<CertificationDecisionRecord, 'certifierId' | 'decidedAt'>[]
  const now       = new Date().toISOString()
  for (const d of decisions) {
    db.certDecisions.push({ ...d, campaignId: campaign.campaignId, certifierId: 'current-user', decidedAt: now })
    campaign.decisions++
    campaign.pending = Math.max(0, campaign.pending - 1)
  }
  res.json({ data: null, message: `${decisions.length} decision(s) recorded` })
})

export default router
