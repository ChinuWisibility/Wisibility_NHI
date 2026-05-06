import type { NHI, RiskLevel, PrivilegeLevel } from '../types/index.js'

const PRIV_SCORES: Record<PrivilegeLevel, number> = {
  ADMIN: 100, ELEVATED: 75, STANDARD: 40, READ_ONLY: 10,
}

export function computeRiskScore(nhi: Partial<NHI> & {
  privilegeLevel: PrivilegeLevel
  breadthScore: number
  createdAt: string
  isHardcoded: boolean
  isShared: boolean
  ownerId?: string
  certExpiry?: string
  vaultPath?: string
}): { score: number; level: RiskLevel } {
  const priv = nhi.privilegeLevel as PrivilegeLevel
  const privilege = PRIV_SCORES[priv] ?? PRIV_SCORES.STANDARD
  const breadth   = Math.min(Number(nhi.breadthScore) || 0, 100)

  const createdDate = new Date(nhi.createdAt)
  const ageMs  = Date.now() - (isNaN(createdDate.getTime()) ? Date.now() : createdDate.getTime())
  const ageDays = ageMs / (1000 * 60 * 60 * 24)
  const age    = Math.min((ageDays / 365) * 100, 100)

  let exposure = 0
  if (nhi.isHardcoded) exposure += 60
  if (!nhi.vaultPath)  exposure += 30
  if (nhi.isShared)    exposure += 10
  exposure = Math.min(exposure, 100)

  let usage = 50
  if (!nhi.ownerId) usage += 30
  if (nhi.certExpiry) {
    const daysLeft = (new Date(nhi.certExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    if (daysLeft < 14) usage += 20
  }
  usage = Math.min(usage, 100)

  const score = Math.round(
    privilege * 0.30 +
    breadth   * 0.25 +
    age       * 0.20 +
    exposure  * 0.15 +
    usage     * 0.10,
  )

  const level: RiskLevel =
    score >= 80 ? 'CRITICAL' :
    score >= 60 ? 'HIGH' :
    score >= 40 ? 'MEDIUM' : 'LOW'

  return { score, level }
}
