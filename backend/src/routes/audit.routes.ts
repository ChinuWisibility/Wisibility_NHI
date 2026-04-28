import { Router } from 'express'
import type { Request, Response } from 'express'
import { db } from '../db/store.js'

const router = Router()

function paginate<T>(items: T[], page: number, limit: number) {
  const total      = items.length
  const totalPages = Math.ceil(total / limit)
  const slice     = items.slice((page - 1) * limit, page * limit)
  return { items: slice, total, page, limit, totalPages }
}

router.get('/logs', (req: Request, res: Response) => {
  const page       = Math.max(1, parseInt(String(req.query.page  ?? '1'),  10))
  const limit      = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)))
  const resourceId = req.query.resourceId as string | undefined
  const actorId    = req.query.actorId    as string | undefined
  const action     = req.query.action     as string | undefined
  const from       = req.query.from       as string | undefined
  const to         = req.query.to         as string | undefined

  let items = [...db.auditLogs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
  if (resourceId) items = items.filter((l) => l.resourceId === resourceId)
  if (actorId)    items = items.filter((l) => l.actorId    === actorId)
  if (action)     items = items.filter((l) => l.action.includes(action))
  if (from)       items = items.filter((l) => l.timestamp  >= from)
  if (to)         items = items.filter((l) => l.timestamp  <= to)

  res.json(paginate(items, page, limit))
})

export default router
