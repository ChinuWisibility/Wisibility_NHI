import { v4 as uuid } from 'uuid'
import type { NHI, PostureIssue } from '../types/index.js'

export function runPostureChecks(nhi: NHI): PostureIssue[] {
  const issues: PostureIssue[] = []
  const now = new Date().toISOString()

  if (nhi.isHardcoded) {
    issues.push({
      issueId: uuid(), nhiId: nhi.nhiId, nhiName: nhi.displayName,
      issueType: 'PLAINTEXT_FOUND',
      severity: nhi.privilegeLevel === 'ADMIN' ? 'CRITICAL' : 'HIGH',
      status: 'OPEN', detectedAt: now,
      details: { reason: 'Credential marked as hardcoded in source or configuration' },
    })
  }

  if (nhi.isShared) {
    issues.push({
      issueId: uuid(), nhiId: nhi.nhiId, nhiName: nhi.displayName,
      issueType: 'SHARED_ACCOUNT',
      severity: nhi.privilegeLevel === 'ADMIN' ? 'HIGH' : 'MEDIUM',
      status: 'OPEN', detectedAt: now,
      details: { reason: 'Credential is shared across multiple consumers' },
    })
  }

  if (!nhi.ownerId) {
    issues.push({
      issueId: uuid(), nhiId: nhi.nhiId, nhiName: nhi.displayName,
      issueType: 'NO_OWNER',
      severity: nhi.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      status: 'OPEN', detectedAt: now,
      details: { reason: 'No individual owner assigned to this NHI' },
    })
  }

  const lastDiscoveredDays =
    (Date.now() - new Date(nhi.lastDiscovered).getTime()) / (1000 * 60 * 60 * 24)
  if (nhi.status === 'DORMANT' || lastDiscoveredDays > 60) {
    issues.push({
      issueId: uuid(), nhiId: nhi.nhiId, nhiName: nhi.displayName,
      issueType: 'STALE_ACCOUNT',
      severity: nhi.privilegeLevel === 'ADMIN' ? 'HIGH' : 'MEDIUM',
      status: 'OPEN', detectedAt: now,
      details: { staleDays: Math.round(lastDiscoveredDays), threshold: 60 },
    })
  }

  if ((nhi.privilegeLevel === 'ADMIN' || nhi.privilegeLevel === 'ELEVATED') &&
      nhi.breadthScore > 60) {
    issues.push({
      issueId: uuid(), nhiId: nhi.nhiId, nhiName: nhi.displayName,
      issueType: 'EXCESS_PERMISSIONS',
      severity: nhi.privilegeLevel === 'ADMIN' ? 'CRITICAL' : 'HIGH',
      status: 'OPEN', detectedAt: now,
      details: { breadthScore: nhi.breadthScore, privilegeLevel: nhi.privilegeLevel },
    })
  }

  return issues
}
