import { Router } from 'express'
import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

router.get('/logs', async (req: Request, res: Response) => {
  const page       = Math.max(1, parseInt(String(req.query.page  ?? '1'),  10))
  const limit      = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)))
  const resourceId = req.query.resourceId as string | undefined
  const actorId    = req.query.actorId    as string | undefined
  const action     = req.query.action     as string | undefined
  const from       = req.query.from       as string | undefined
  const to         = req.query.to         as string | undefined

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (resourceId) where.resourceId = resourceId
  if (actorId)    where.actorId    = actorId
  if (action)     where.action     = { contains: action, mode: 'insensitive' }
  if (from || to) {
    where.timestamp = {}
    if (from) where.timestamp.gte = new Date(from)
    if (to)   where.timestamp.lte = new Date(to)
  }

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { timestamp: 'desc' } }),
    prisma.auditLog.count({ where }),
  ])
  res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) })
})

export default router
