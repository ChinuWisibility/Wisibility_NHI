import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import type { Request, Response } from 'express'
import { db } from '../db/store.js'
import { computeRiskScore } from '../services/risk-scorer.js'
import type { NHI, NHIStatus, RiskLevel, Environment, NHIType } from '../types/index.js'

const router = Router()

function paginate<T>(items: T[], page: number, limit: number) {
  const total      = items.length
  const totalPages = Math.ceil(total / limit)
  const slice     = items.slice((page - 1) * limit, page * limit)
  return { items: slice, total, page, limit, totalPages }
}

router.get('/', (req: Request, res: Response) => {
  const page      = Math.max(1, parseInt(String(req.query.page  ?? '1'),  10))
  const limit     = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)))
  const q         = String(req.query.q         ?? '').toLowerCase()
  const riskLevel = req.query.riskLevel  as RiskLevel   | undefined
  const env       = req.query.environment as Environment | undefined
  const nhiType   = req.query.nhiType    as NHIType     | undefined
  const status    = req.query.status     as NHIStatus   | undefined
  const ownerId   = req.query.ownerId    as string      | undefined

  let items = db.nhis
  if (q)         items = items.filter((n) => n.displayName.toLowerCase().includes(q))
  if (riskLevel) items = items.filter((n) => n.riskLevel === riskLevel)
  if (env)       items = items.filter((n) => n.environment === env)
  if (nhiType)   items = items.filter((n) => n.nhiType === nhiType)
  if (status)    items = items.filter((n) => n.status === status)
  if (ownerId)   items = items.filter((n) => n.ownerId === ownerId)

  res.json(paginate(items, page, limit))
})

router.get('/:id', (req: Request, res: Response) => {
  const nhi = db.nhis.find((n) => n.nhiId === req.params.id)
  if (!nhi) { res.status(404).json({ error: 'NHI not found' }); return }
  res.json({ data: nhi })
})

router.post('/', (req: Request, res: Response) => {
  const body = req.body as Partial<NHI>
  const now  = new Date().toISOString()
  const { score, level } = computeRiskScore({
    privilegeLevel: body.privilegeLevel ?? 'STANDARD',
    breadthScore:   body.breadthScore   ?? 0,
    createdAt:      now,
    isHardcoded:    body.isHardcoded    ?? false,
    isShared:       body.isShared       ?? false,
    ownerId:        body.ownerId,
    certExpiry:     body.certExpiry,
    vaultPath:      body.vaultPath,
  })
  const nhi: NHI = {
    nhiId:           uuid(),
    displayName:     body.displayName     ?? 'Unnamed NHI',
    nhiType:         body.nhiType         ?? 'SERVICE_ACCOUNT',
    credentialType:  body.credentialType  ?? 'PASSWORD',
    status:          body.status          ?? 'PENDING',
    riskScore:       score,
    riskLevel:       level,
    ownerId:         body.ownerId,
    ownerTeam:       body.ownerTeam,
    environment:     body.environment     ?? 'DEV',
    privilegeLevel:  body.privilegeLevel  ?? 'STANDARD',
    breadthScore:    body.breadthScore    ?? 0,
    isShared:        body.isShared        ?? false,
    isHardcoded:     body.isHardcoded     ?? false,
    vaultPath:       body.vaultPath,
    rotationSchedule: body.rotationSchedule,
    certExpiry:      body.certExpiry,
    lastDiscovered:  now,
    createdAt:       now,
    updatedAt:       now,
    sourceConnector: body.sourceConnector ?? 'manual',
    tags:            body.tags            ?? {},
  }
  db.nhis.push(nhi)
  res.status(201).json({ data: nhi })
})

router.put('/:id', (req: Request, res: Response) => {
  const idx = db.nhis.findIndex((n) => n.nhiId === req.params.id)
  if (idx === -1) { res.status(404).json({ error: 'NHI not found' }); return }
  const updated: NHI = { ...db.nhis[idx], ...req.body, updatedAt: new Date().toISOString() }
  const { score, level } = computeRiskScore(updated)
  updated.riskScore = score
  updated.riskLevel = level
  db.nhis[idx] = updated
  res.json({ data: updated })
})

router.delete('/:id', (req: Request, res: Response) => {
  const idx = db.nhis.findIndex((n) => n.nhiId === req.params.id)
  if (idx === -1) { res.status(404).json({ error: 'NHI not found' }); return }
  db.nhis[idx] = { ...db.nhis[idx], status: 'ARCHIVED', updatedAt: new Date().toISOString() }
  res.json({ data: null, message: 'NHI archived' })
})

export default router
