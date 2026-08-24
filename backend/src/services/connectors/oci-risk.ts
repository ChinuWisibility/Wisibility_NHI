export interface OciRiskContext {
  displayName: string
  kind: 'user' | 'dynamic-group' | 'identity-provider'
  hasApiKey: boolean
  apiKeyCount: number
  keyAgeDays?: number
  authTokenCount: number
  customerSecretKeyCount: number
  adminAccess: boolean
  iamManage: boolean
  secretsAccess: boolean
  tenancyScope: boolean
  broadMatchingRule: boolean
  anyUserPolicy: boolean
  federated: boolean
  cicd: boolean
  lastUsedDays?: number | null
  hasOwner: boolean
  workloadCount: number
  inactive: boolean
}

export interface OciFinding {
  ruleId: string
  issueType: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  message: string
}

export function evaluateOciRisk(ctx: OciRiskContext): {
  score: number
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  privilegeLevel: 'ADMIN' | 'ELEVATED' | 'STANDARD' | 'READ_ONLY'
  breadthScore: number
  findings: OciFinding[]
  reasons: string[]
} {
  const findings: OciFinding[] = []
  const reasons: string[] = []
  let score = 18

  if (ctx.hasApiKey) {
    findings.push({
      ruleId: ctx.adminAccess ? 'NHI-OCI-002' : 'NHI-OCI-001',
      issueType: 'LONG_LIVED_SECRET',
      severity: ctx.adminAccess ? 'CRITICAL' : 'HIGH',
      message: ctx.adminAccess
        ? 'IAM user has an API key and tenancy or manage all-resources privilege.'
        : 'IAM user has a long-lived API key.',
    })
    score += ctx.adminAccess ? 35 : 18
    reasons.push(ctx.adminAccess ? 'API key + admin' : 'Long-lived API key')
  }

  if ((ctx.keyAgeDays ?? 0) > 180) {
    findings.push({
      ruleId: 'NHI-OCI-003',
      issueType: 'LONG_LIVED_SECRET',
      severity: 'HIGH',
      message: 'API key is older than 180 days.',
    })
    score += 12
    reasons.push('API key > 180 days')
  }

  if (ctx.authTokenCount > 0) {
    findings.push({
      ruleId: 'NHI-OCI-006',
      issueType: 'LONG_LIVED_SECRET',
      severity: ctx.adminAccess ? 'HIGH' : 'MEDIUM',
      message: 'User has auth tokens (SMTP / Swift-style long-lived secrets).',
    })
    score += 8
    reasons.push('Auth tokens')
  }

  if (ctx.customerSecretKeyCount > 0) {
    findings.push({
      ruleId: 'NHI-OCI-007',
      issueType: 'LONG_LIVED_SECRET',
      severity: 'HIGH',
      message: 'User has customer secret keys (S3-compatible long-lived credentials).',
    })
    score += 10
    reasons.push('Customer secret keys')
  }

  if (ctx.apiKeyCount + ctx.authTokenCount + ctx.customerSecretKeyCount > 1) {
    findings.push({
      ruleId: 'NHI-OCI-015',
      issueType: 'LONG_LIVED_SECRET',
      severity: 'MEDIUM',
      message: 'Identity has multiple active credential types.',
    })
    score += 6
    reasons.push('Multiple credential types')
  }

  if (ctx.adminAccess || ctx.iamManage) {
    findings.push({
      ruleId: ctx.iamManage && !ctx.adminAccess ? 'NHI-OCI-005' : 'NHI-OCI-005',
      issueType: 'EXCESS_PERMISSIONS',
      severity: 'CRITICAL',
      message: ctx.adminAccess
        ? 'NHI can manage all-resources or has tenancy-admin equivalent policy.'
        : 'NHI can manage IAM users, groups, or policies.',
    })
    score += 25
    reasons.push(ctx.adminAccess ? 'manage all-resources' : 'IAM manage')
  }

  if (ctx.anyUserPolicy) {
    findings.push({
      ruleId: 'NHI-OCI-014',
      issueType: 'BROAD_FEDERATION',
      severity: 'CRITICAL',
      message: 'Policy uses any-user, so every principal in the tenancy inherits this access.',
    })
    score += 16
    reasons.push('any-user policy')
  }

  if (ctx.kind === 'dynamic-group' && ctx.broadMatchingRule) {
    findings.push({
      ruleId: 'NHI-OCI-008',
      issueType: 'BROAD_FEDERATION',
      severity: ctx.adminAccess ? 'CRITICAL' : 'HIGH',
      message: 'Dynamic group matching rule is tenancy-wide or otherwise overly broad.',
    })
    score += ctx.adminAccess ? 20 : 12
    reasons.push('Broad dynamic-group matching')
  }

  if (ctx.kind === 'dynamic-group' && ctx.adminAccess) {
    findings.push({
      ruleId: 'NHI-OCI-009',
      issueType: 'EXCESS_PERMISSIONS',
      severity: 'CRITICAL',
      message: 'Dynamic group (instance / resource principal) can manage all-resources.',
    })
    score += 14
    reasons.push('Instance principal + admin')
  }

  if (ctx.secretsAccess) {
    findings.push({
      ruleId: 'NHI-OCI-011',
      issueType: 'KEY_VAULT_ACCESS',
      severity: 'HIGH',
      message: 'NHI can use or manage Vault secrets (secret-family / secret-bundles).',
    })
    score += 10
    reasons.push('Vault secret access')
  }

  if (ctx.federated || ctx.kind === 'identity-provider') {
    findings.push({
      ruleId: 'NHI-OCI-010',
      issueType: 'EXTERNAL_FEDERATION',
      severity: ctx.adminAccess || ctx.cicd ? 'HIGH' : 'MEDIUM',
      message: ctx.cicd
        ? 'Federated / CI identity can reach this tenancy.'
        : 'Identity provider or federated principal discovered.',
    })
    score += ctx.cicd ? 12 : 6
    reasons.push(ctx.cicd ? 'CI/CD federation' : 'Federation')
  }

  if (!ctx.hasOwner && ctx.kind !== 'identity-provider') {
    findings.push({
      ruleId: 'NHI-OCI-012',
      issueType: 'NO_OWNER',
      severity: ctx.adminAccess ? 'HIGH' : 'MEDIUM',
      message: 'Production NHI has no Owner tag or assigned owner.',
    })
    score += 5
    reasons.push('No owner')
  }

  const dormant =
    ctx.inactive || (ctx.lastUsedDays != null && ctx.lastUsedDays > 60)
  if (dormant && (ctx.adminAccess || ctx.hasApiKey)) {
    findings.push({
      ruleId: 'NHI-OCI-013',
      issueType: 'STALE_ACCOUNT',
      severity: 'HIGH',
      message: 'Privileged or keyed NHI appears dormant or inactive.',
    })
    score += 10
    reasons.push('Dormant privileged NHI')
  } else if (dormant) {
    score += 4
    reasons.push('Inactive / unused 60+ days')
  }

  if (ctx.kind === 'dynamic-group' && !ctx.adminAccess && ctx.workloadCount > 0) {
    reasons.push('Instance / resource principal')
    score -= 4
  }

  score = Math.max(0, Math.min(100, Math.round(score)))
  const level = score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW'
  const privilegeLevel: 'ADMIN' | 'ELEVATED' | 'STANDARD' | 'READ_ONLY' =
    ctx.adminAccess || ctx.iamManage
      ? 'ADMIN'
      : ctx.secretsAccess || ctx.tenancyScope
        ? 'ELEVATED'
        : 'STANDARD'

  return {
    score,
    level,
    privilegeLevel,
    breadthScore: Math.min(
      100,
      (ctx.adminAccess ? 70 : 20) + ctx.workloadCount * 8 + (ctx.tenancyScope ? 15 : 0),
    ),
    findings,
    reasons: [...new Set(reasons)],
  }
}
