import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

router.get('/score', async (_req: Request, res: Response) => {
  const scores = await prisma.complianceScore.findMany()
  res.json({ data: scores })
})

router.post('/export/:framework', (req: Request, res: Response) => {
  res.json({
    data: {
      url:       `/exports/${req.params.framework}-${Date.now()}.csv`,
      exportedAt: new Date().toISOString(),
    },
  })
})

router.get('/campaigns', async (_req: Request, res: Response) => {
  const campaigns = await prisma.certificationCampaign.findMany({ orderBy: { createdAt: 'desc' } })
  res.json({ data: campaigns })
})

router.get('/campaigns/:id', async (req: Request, res: Response) => {
  const campaign = await prisma.certificationCampaign.findUnique({ where: { campaignId: req.params.id } })
  if (!campaign) { res.status(404).json({ error: 'Campaign not found' }); return }
  const nhiIds   = campaign.nhiScope as string[]
  const [nhis, decisions] = await Promise.all([
    prisma.nhi.findMany({ where: { nhiId: { in: nhiIds } } }),
    prisma.certificationDecision.findMany({ where: { campaignId: campaign.campaignId } }),
  ])
  res.json({ data: { ...campaign, nhis, decisions } })
})

router.post('/campaigns', async (req: Request, res: Response) => {
  const body = req.body
  const nhiIds: string[] = body.nhiScope ?? []
  const campaign = await prisma.certificationCampaign.create({
    data: {
      campaignId: uuid(),
      name:       body.name       ?? 'New Campaign',
      framework:  body.framework  ?? 'SOC2',
      status:     'ACTIVE',
      nhiScope:   nhiIds,
      certifiers: body.certifiers ?? [],
      dueDate:    new Date(body.dueDate ?? Date.now() + 30 * 86_400_000),
      decisions:  0,
      pending:    nhiIds.length,
    },
  })
  res.status(201).json({ data: campaign })
})

router.post('/:campaignId/decisions', async (req: Request, res: Response) => {
  const campaign = await prisma.certificationCampaign.findUnique({ where: { campaignId: req.params.campaignId } })
  if (!campaign) { res.status(404).json({ error: 'Campaign not found' }); return }
  const decision = await prisma.certificationDecision.create({
    data: {
      campaignId:    campaign.campaignId,
      nhiId:         req.body.nhiId,
      certifierId:   req.body.certifierId ?? 'current-user',
      decision:      req.body.decision,
      justification: req.body.justification ?? '',
    },
  })
  await prisma.certificationCampaign.update({
    where: { campaignId: campaign.campaignId },
    data:  { decisions: { increment: 1 }, pending: { decrement: 1 } },
  })
  res.status(201).json({ data: decision })
})

export default router
