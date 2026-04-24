import type { NHI, NHIRiskBreakdown } from '@/types/nhi.types'
import type { RiskLevel } from '@/types/nhi.types'

const WEIGHTS = {
  privilege: 0.30,
  breadth:   0.25,
  age:       0.20,
  exposure:  0.15,
  usage:     0.10,
}

export function calculateRisk(nhi: Partial<NHI>): NHIRiskBreakdown {
  const privilege = privilegeScore(nhi.privilegeLevel)
  const breadth   = nhi.breadthScore ?? 50
  const age       = ageScore(nhi.createdAt)
  const exposure  = exposureScore(nhi.isHardcoded, nhi.isShared)
  const usage     = 50 // placeholder — computed server-side from activity data

  const total = Math.round(
    privilege * WEIGHTS.privilege +
    breadth   * WEIGHTS.breadth +
    age       * WEIGHTS.age +
    exposure  * WEIGHTS.exposure +
    usage     * WEIGHTS.usage,
  )

  return { privilege, breadth, age, exposure, usage, total }
}

function privilegeScore(level?: string): number {
  return { ADMIN: 100, ELEVATED: 75, STANDARD: 40, READ_ONLY: 15 }[level ?? ''] ?? 50
}

function ageScore(createdAt?: string): number {
  if (!createdAt) return 50
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000)
  if (days > 730) return 100
  if (days > 365) return 80
  if (days > 90)  return 60
  return 20
}

function exposureScore(isHardcoded?: boolean, isShared?: boolean): number {
  let score = 0
  if (isHardcoded) score += 60
  if (isShared)    score += 40
  return Math.min(score, 100)
}

export function scoreToLevel(score: number): RiskLevel {
  if (score >= 80) return 'CRITICAL'
  if (score >= 60) return 'HIGH'
  if (score >= 40) return 'MEDIUM'
  return 'LOW'
}
