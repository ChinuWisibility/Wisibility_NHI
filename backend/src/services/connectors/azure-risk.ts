export interface AzureRiskContext {
  displayName: string
  isManagedIdentity: boolean
  miKind?: 'system' | 'user' | ''
  secretCount: number
  certCount: number
  ficCount: number
  oldestSecretAgeDays?: number
  secretYears?: number
  hasOwner: boolean
  directoryRoles: string[]
  rbacRoles: string[]
  rbacScopes: string[]
  hasKeyVaultAccess: boolean
  hasStorageAccess: boolean
  attachmentCount: number
  workloadCount: number
  ficIssuers: string[]
  ficSubjects: string[]
  disabled: boolean
  lastSignInDays?: number | null
  resourceCount: number
}

export interface AzureFinding {
  ruleId: string
  issueType: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  message: string
  posture?: 'GOOD'
}

const OWNER_ROLES = ['owner']
const CONTRIBUTOR_ROLES = ['contributor']
const AUTH_ADMIN_ROLES = ['user access administrator', 'role based access control administrator', 'owner']
const KV_ROLES = ['key vault secrets user', 'key vault secrets officer', 'key vault administrator', 'key vault contributor']
const STORAGE_ROLES = ['storage blob', 'storage account']

function hasRole(roles: string[], needles: string[]) {
  return roles.some((r) => needles.some((n) => r.toLowerCase().includes(n)))
}

function isSubscriptionScope(scopes: string[]) {
  return scopes.some((s) => /\/subscriptions\/[^/]+$/i.test(s.trim()))
}

function isBroadFederation(subjects: string[]) {
  return subjects.some((s) => {
    const v = s.toLowerCase()
    return v.includes('*') || v.endsWith(':ref:refs/heads/*') || /^repo:[^/]+\/\*$/.test(v) || v === '' || v === '*'
  })
}

function isExternalIssuer(issuers: string[]) {
  return issuers.some((i) => /github|gitlab|okta|circleci|terraform|amazonaws|google/i.test(i))
}

function isCicdIssuer(issuers: string[]) {
  return issuers.some((i) => /github|dev\.azure|gitlab|circleci/i.test(i))
}

export function evaluateAzureRisk(ctx: AzureRiskContext): {
  score: number
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  privilegeLevel: 'ADMIN' | 'ELEVATED' | 'STANDARD' | 'READ_ONLY'
  breadthScore: number
  findings: AzureFinding[]
  reasons: string[]
} {
  const findings: AzureFinding[] = []
  const reasons: string[] = []
  let score = 20

  const privilegedRbac = hasRole(ctx.rbacRoles, [...OWNER_ROLES, ...CONTRIBUTOR_ROLES])
  const ownerRbac = hasRole(ctx.rbacRoles, OWNER_ROLES)
  const canModifyAccess = hasRole(ctx.rbacRoles, AUTH_ADMIN_ROLES)
  const subScope = isSubscriptionScope(ctx.rbacScopes)
  const secretless = ctx.isManagedIdentity || (ctx.ficCount > 0 && ctx.secretCount === 0)
  const dormant = ctx.disabled || (ctx.lastSignInDays != null && ctx.lastSignInDays > 60) || /dormant/i.test(ctx.displayName)
  const unattached = ctx.miKind === 'user' && ctx.attachmentCount === 0
  const shared = ctx.miKind === 'user' && ctx.attachmentCount > 1

  if (ctx.secretCount > 0 && (ctx.oldestSecretAgeDays ?? 0) > 180) {
    findings.push({
      ruleId: 'NHI-AZ-001',
      issueType: 'LONG_LIVED_SECRET',
      severity: 'HIGH',
      message: 'Long-lived credential detected on workload identity.',
    })
    score += 15
    reasons.push('Long-lived client secret')
  } else if (ctx.secretCount > 0 && (ctx.secretYears ?? 0) >= 2) {
    findings.push({
      ruleId: 'NHI-AZ-001',
      issueType: 'LONG_LIVED_SECRET',
      severity: 'HIGH',
      message: 'Client secret lifetime is 2+ years.',
    })
    score += 12
    reasons.push('Long-lived client secret')
  } else if (ctx.secretCount > 0) {
    score += 8
    reasons.push('Client secret credential')
  }

  if (ownerRbac && subScope) {
    findings.push({
      ruleId: 'NHI-AZ-002',
      issueType: 'EXCESS_PERMISSIONS',
      severity: 'CRITICAL',
      message: 'Privileged NHI with Owner at subscription scope.',
    })
    score += 25
    reasons.push('Subscription-wide Owner')
  } else if (privilegedRbac && subScope) {
    findings.push({
      ruleId: 'NHI-AZ-002',
      issueType: 'EXCESS_PERMISSIONS',
      severity: 'CRITICAL',
      message: 'Privileged NHI with Contributor/Owner at subscription scope.',
    })
    findings.push({
      ruleId: 'NHI-AZ-014',
      issueType: 'EXCESS_PERMISSIONS',
      severity: 'CRITICAL',
      message: 'NHI has Contributor at subscription scope.',
    })
    score += 20
    reasons.push('Subscription-wide Contributor')
  } else if (privilegedRbac) {
    findings.push({
      ruleId: 'NHI-AZ-002',
      issueType: 'EXCESS_PERMISSIONS',
      severity: 'HIGH',
      message: 'NHI has Contributor/Owner outside least-privilege resource scope.',
    })
    score += 15
    reasons.push('Contributor / Owner role')
  }

  if (ctx.hasKeyVaultAccess) {
    findings.push({
      ruleId: 'NHI-AZ-003',
      issueType: 'KEY_VAULT_ACCESS',
      severity: privilegedRbac ? 'HIGH' : 'MEDIUM',
      message: 'NHI can read Key Vault secrets.',
    })
    score += privilegedRbac ? 12 : 8
    reasons.push('Key Vault secret access')
  }

  if (dormant && ctx.rbacRoles.length > 0) {
    findings.push({
      ruleId: 'NHI-AZ-004',
      issueType: 'STALE_ACCOUNT',
      severity: privilegedRbac || subScope ? 'HIGH' : 'MEDIUM',
      message: 'Dormant NHI still has Azure permissions assigned.',
    })
    score += privilegedRbac ? 12 : 6
    reasons.push('Dormant with standing access')
  }

  if (unattached && ctx.rbacRoles.length > 0) {
    findings.push({
      ruleId: 'NHI-AZ-005',
      issueType: 'ORPHANED_IDENTITY',
      severity: privilegedRbac ? 'HIGH' : 'MEDIUM',
      message: 'Potentially orphaned UAMI — no resource assignment, permissions remain.',
    })
    score += privilegedRbac ? 12 : 7
    reasons.push('Unattached user-assigned identity')
  }

  if (shared && (privilegedRbac || ctx.hasKeyVaultAccess || ctx.hasStorageAccess)) {
    findings.push({
      ruleId: 'NHI-AZ-006',
      issueType: 'SHARED_ACCOUNT',
      severity: 'HIGH',
      message: 'Shared managed identity attached to multiple workloads with broad access.',
    })
    score += 15
    reasons.push('Shared UAMI with broad blast radius')
  }

  if (ctx.ficCount > 0 && isExternalIssuer(ctx.ficIssuers) && privilegedRbac) {
    findings.push({
      ruleId: 'NHI-AZ-007',
      issueType: 'EXTERNAL_FEDERATION',
      severity: 'HIGH',
      message: 'External federated identity has broad Azure permissions.',
    })
    score += 12
    reasons.push('External federation + privileged RBAC')
  }

  if (ctx.ficCount > 0 && isBroadFederation(ctx.ficSubjects)) {
    findings.push({
      ruleId: 'NHI-AZ-008',
      issueType: 'BROAD_FEDERATION',
      severity: 'HIGH',
      message: 'Federated identity trust is broader than the intended workload boundary.',
    })
    score += 10
    reasons.push('Broad federation subject')
  }

  if (ctx.ficCount > 0 && isCicdIssuer(ctx.ficIssuers) && privilegedRbac) {
    findings.push({
      ruleId: 'NHI-AZ-009',
      issueType: 'EXTERNAL_FEDERATION',
      severity: subScope ? 'CRITICAL' : 'HIGH',
      message: 'CI/CD federated identity has production Contributor/Owner.',
    })
    score += subScope ? 15 : 10
    reasons.push('CI/CD production privilege')
  }

  if (ctx.resourceCount >= 4 && ctx.workloadCount <= 1 && !ctx.isManagedIdentity) {
    findings.push({
      ruleId: 'NHI-AZ-010',
      issueType: 'EXCESS_PERMISSIONS',
      severity: 'MEDIUM',
      message: 'NHI can reach many resources relative to observed workload use.',
    })
    score += 6
    reasons.push('Excessive resource access')
  }

  if (!ctx.hasOwner && !ctx.isManagedIdentity) {
    findings.push({
      ruleId: 'NHI-AZ-011',
      issueType: 'NO_OWNER',
      severity: privilegedRbac ? 'HIGH' : 'MEDIUM',
      message: 'NHI has no assigned owner.',
    })
    score += 5
    reasons.push('No owner')
  }

  if (ctx.secretCount + ctx.certCount >= 2) {
    findings.push({
      ruleId: 'NHI-AZ-012',
      issueType: 'LONG_LIVED_SECRET',
      severity: 'MEDIUM',
      message: 'Service principal has multiple active secrets or certificates.',
    })
    score += 6
    reasons.push('Multiple active credentials')
  }

  if (secretless && !privilegedRbac && !subScope) {
    findings.push({
      ruleId: 'NHI-AZ-013',
      issueType: 'EXCESS_PERMISSIONS',
      severity: 'LOW',
      message: 'Secretless authentication with no long-lived credential.',
      posture: 'GOOD',
    })
    score -= 8
    reasons.push('Secretless (managed identity or federation)')
  }

  if (canModifyAccess) {
    findings.push({
      ruleId: 'NHI-AZ-015',
      issueType: 'EXCESS_PERMISSIONS',
      severity: 'CRITICAL',
      message: 'NHI can modify Azure authorization (Owner or User Access Administrator).',
    })
    score += 15
    reasons.push('Can modify access')
  }

  if (ctx.hasStorageAccess) score += 4
  if (ctx.directoryRoles.length) score += 8

  score = Math.max(0, Math.min(100, Math.round(score)))
  const level = score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW'

  let privilegeLevel: 'ADMIN' | 'ELEVATED' | 'STANDARD' | 'READ_ONLY' = 'STANDARD'
  if (ownerRbac || canModifyAccess || (privilegedRbac && subScope)) privilegeLevel = 'ADMIN'
  else if (privilegedRbac || ctx.hasKeyVaultAccess || ctx.directoryRoles.length) privilegeLevel = 'ELEVATED'
  else if (ctx.rbacRoles.every((r) => /reader/i.test(r)) && ctx.rbacRoles.length > 0) privilegeLevel = 'READ_ONLY'

  const breadthScore = Math.min(100,
    (subScope ? 50 : 0)
    + ctx.rbacRoles.length * 10
    + ctx.resourceCount * 8
    + ctx.attachmentCount * 12
    + (ctx.hasKeyVaultAccess ? 15 : 0),
  )

  return {
    score,
    level,
    privilegeLevel,
    breadthScore,
    findings: findings.filter((f) => f.posture !== 'GOOD' || f.severity === 'LOW'),
    reasons: [...new Set(reasons)],
  }
}

export function findingIssueId(nhiId: string, ruleId: string) {
  return `${ruleId}:${nhiId}`.slice(0, 80)
}
