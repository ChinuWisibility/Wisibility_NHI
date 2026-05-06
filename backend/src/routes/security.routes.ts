import { Router } from 'express'
import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

function parseDays(schedule: string): number {
  if (schedule.endsWith('d')) return parseInt(schedule)
  if (schedule.endsWith('h')) return parseInt(schedule) / 24
  return 90
}

router.get('/vaults', async (_req: Request, res: Response) => {
  const VAULT_TYPES = ['VAULT_HASHICORP', 'VAULT_CYBERARK', 'VAULT_AWS_SM']
  const vaultConnectors = await prisma.connectorConfig.findMany({
    where: { connectorType: { in: VAULT_TYPES } },
  })
  const nhis = await prisma.nhi.findMany({ select: { vaultPath: true, sourceConnector: true } })

  const vaults = vaultConnectors.map((v) => {
    const managedNhis = nhis.filter((n) => n.vaultPath?.startsWith(`vault/${v.connectorId}`) || n.sourceConnector === v.connectorId).length
    return {
      connectorId:   v.connectorId,
      displayName:   v.displayName,
      connectorType: v.connectorType,
      status:        v.status,
      managedNhis,
      lastRunAt:     v.lastRunAt,
    }
  })

  const totalNhis      = nhis.length
  const inVaultCount   = nhis.filter((n) => !!n.vaultPath).length
  const coveragePct    = totalNhis > 0 ? Math.round((inVaultCount / totalNhis) * 100) : 0

  res.json({ data: { vaults, totalNhis, inVaultCount, coveragePct } })
})

router.get('/rotation', async (_req: Request, res: Response) => {
  const nhis = await prisma.nhi.findMany({
    where:   { rotationSchedule: { not: null }, status: { not: 'ARCHIVED' } },
    orderBy: { updatedAt: 'asc' },
  })

  const now = Date.now()
  const jobs = nhis.map((n) => {
    const periodDays     = parseDays(n.rotationSchedule!)
    const lastRotated    = n.updatedAt
    const nextRotation   = new Date(lastRotated.getTime() + periodDays * 86_400_000)
    const daysUntil      = Math.floor((nextRotation.getTime() - now) / 86_400_000)
    const status         = daysUntil < 0 ? 'OVERDUE' : daysUntil <= 7 ? 'DUE_SOON' : 'SCHEDULED'
    return {
      nhiId:         n.nhiId,
      nhiName:       n.displayName,
      nhiType:       n.nhiType,
      environment:   n.environment,
      ownerTeam:     n.ownerTeam ?? 'Unknown',
      schedule:      n.rotationSchedule,
      lastRotatedAt: lastRotated.toISOString(),
      nextRotation:  nextRotation.toISOString(),
      daysUntil,
      status,
    }
  }).sort((a, b) => a.daysUntil - b.daysUntil)

  const overdue  = jobs.filter((j) => j.status === 'OVERDUE').length
  const dueSoon  = jobs.filter((j) => j.status === 'DUE_SOON').length
  res.json({ data: { jobs, total: jobs.length, overdue, dueSoon } })
})

router.get('/hygiene', async (_req: Request, res: Response) => {
  const ninety = new Date(Date.now() - 90 * 86_400_000)
  const nhis = await prisma.nhi.findMany({ where: { status: { not: 'ARCHIVED' } } })
  const active = nhis.filter((n) => n.status === 'ACTIVE')

  const hardcodedNhis = active.filter((n) => n.isHardcoded)
  const sharedNhis    = active.filter((n) => n.isShared)
  const noVaultNhis   = active.filter((n) => !n.vaultPath)
  const noOwnerNhis   = active.filter((n) => !n.ownerId)
  const stale90Nhis   = nhis.filter((n) => n.updatedAt < ninety)

  const total = nhis.length

  const byCategory = [
    { label: 'Hardcoded credentials in source / config', severity: 'CRITICAL', count: hardcodedNhis.length },
    { label: 'Credentials shared across multiple services',severity: 'HIGH',     count: sharedNhis.length    },
    { label: 'Active NHIs not stored in any vault',        severity: 'HIGH',     count: noVaultNhis.length   },
    { label: 'NHIs with no assigned owner',                severity: 'MEDIUM',   count: noOwnerNhis.length   },
    { label: 'No activity in 90+ days',                    severity: 'LOW',      count: stale90Nhis.length   },
  ]

  res.json({
    data: {
      hardcoded:  hardcodedNhis.length,
      shared:     sharedNhis.length,
      noVault:    noVaultNhis.length,
      noOwner:    noOwnerNhis.length,
      stale90:    stale90Nhis.length,
      total,
      byCategory,
      nhis: {
        hardcoded: hardcodedNhis.slice(0, 10),
        shared:    sharedNhis.slice(0, 10),
        noVault:   noVaultNhis.slice(0, 10),
      },
    },
  })
})

export default router
