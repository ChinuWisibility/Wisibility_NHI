export interface AwsRiskContext {
  displayName: string
  kind: 'user' | 'role' | 'service-linked'
  hasAccessKey: boolean
  keyAgeDays?: number
  unusedKeyDays?: number
  multipleKeys: boolean
  adminAccess: boolean
  powerUser: boolean
  iamStar: boolean
  passRole: boolean
  assumeRoleStar: boolean
  secretsAccess: boolean
  kmsAccess: boolean
  wildcardTrust: boolean
  externalTrust: boolean
  missingExternalId: boolean
  oidcTrust: boolean
  oidcBroad: boolean
  cicd: boolean
  publicWorkload: boolean
  lastUsedDays?: number | null
  hasOwner: boolean
  workloadCount: number
}

export interface AwsFinding {
  ruleId: string
  issueType: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  message: string
  informational?: boolean
}

export function evaluateAwsRisk(ctx: AwsRiskContext): {
  score: number
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  privilegeLevel: 'ADMIN' | 'ELEVATED' | 'STANDARD' | 'READ_ONLY'
  breadthScore: number
  findings: AwsFinding[]
  reasons: string[]
} {
  const findings: AwsFinding[] = []
  const reasons: string[] = []

  if (ctx.kind === 'service-linked') {
    findings.push({
      ruleId: 'NHI-AWS-023',
      issueType: 'EXCESS_PERMISSIONS',
      severity: 'LOW',
      message: 'AWS-managed service-linked role. Informational — not an actionable customer NHI.',
      informational: true,
    })
    return {
      score: 6,
      level: 'LOW',
      privilegeLevel: 'STANDARD',
      breadthScore: 5,
      findings,
      reasons: ['AWS managed service-linked role'],
    }
  }

  let score = 18

  if (ctx.hasAccessKey) {
    findings.push({
      ruleId: 'NHI-AWS-001',
      issueType: 'LONG_LIVED_SECRET',
      severity: ctx.adminAccess ? 'CRITICAL' : 'HIGH',
      message: ctx.adminAccess
        ? 'IAM user has an active long-lived access key and administrative privileges.'
        : 'IAM user has an active long-lived access key.',
    })
    score += ctx.adminAccess ? 35 : 18
    reasons.push(ctx.adminAccess ? 'Access key + admin' : 'Long-lived access key')
  }

  if ((ctx.keyAgeDays ?? 0) > 180) {
    findings.push({
      ruleId: 'NHI-AWS-003',
      issueType: 'LONG_LIVED_SECRET',
      severity: 'HIGH',
      message: 'Access key is older than 180 days.',
    })
    score += 12
    reasons.push('Access key > 180 days')
  }

  if ((ctx.unusedKeyDays ?? 0) > 90) {
    findings.push({
      ruleId: 'NHI-AWS-004',
      issueType: 'STALE_ACCOUNT',
      severity: ctx.adminAccess ? 'HIGH' : 'MEDIUM',
      message: 'Access key unused for more than 90 days.',
    })
    score += 8
    reasons.push('Unused access key')
  }

  if (ctx.multipleKeys) {
    findings.push({
      ruleId: 'NHI-AWS-018',
      issueType: 'LONG_LIVED_SECRET',
      severity: 'MEDIUM',
      message: 'Identity has multiple active credentials.',
    })
    score += 6
    reasons.push('Multiple active keys')
  }

  if (ctx.adminAccess || ctx.iamStar) {
    findings.push({
      ruleId: ctx.iamStar ? 'NHI-AWS-006' : 'NHI-AWS-005',
      issueType: 'EXCESS_PERMISSIONS',
      severity: 'CRITICAL',
      message: ctx.iamStar ? 'NHI has iam:* or equivalent IAM modification rights.' : 'NHI has AdministratorAccess.',
    })
    score += 25
    reasons.push(ctx.iamStar ? 'iam:*' : 'AdministratorAccess')
  } else if (ctx.powerUser) {
    score += 14
    reasons.push('PowerUser-class permissions')
  }

  if (ctx.assumeRoleStar) {
    findings.push({
      ruleId: 'NHI-AWS-007',
      issueType: 'EXCESS_PERMISSIONS',
      severity: 'CRITICAL',
      message: 'NHI can sts:AssumeRole without a meaningful resource restriction.',
    })
    score += 18
    reasons.push('Unrestricted sts:AssumeRole')
  }

  if (ctx.passRole && (ctx.adminAccess || ctx.iamStar)) {
    findings.push({
      ruleId: 'NHI-AWS-008',
      issueType: 'EXCESS_PERMISSIONS',
      severity: 'CRITICAL',
      message: 'NHI has iam:PassRole combined with high privilege — privilege-escalation path.',
    })
    score += 12
    reasons.push('PassRole + privileged')
  }

  if (ctx.wildcardTrust) {
    findings.push({
      ruleId: 'NHI-AWS-010',
      issueType: 'BROAD_FEDERATION',
      severity: 'CRITICAL',
      message: 'Trust policy principal is wildcard (*).',
    })
    score += 22
    reasons.push('Wildcard trust principal')
  }

  if (ctx.externalTrust && ctx.adminAccess) {
    findings.push({
      ruleId: 'NHI-AWS-009',
      issueType: 'EXTERNAL_FEDERATION',
      severity: 'CRITICAL',
      message: 'External principal can assume a privileged production role.',
    })
    score += 18
    reasons.push('External privileged trust')
  } else if (ctx.externalTrust && ctx.missingExternalId) {
    findings.push({
      ruleId: 'NHI-AWS-011',
      issueType: 'EXTERNAL_FEDERATION',
      severity: 'HIGH',
      message: 'Cross-account trust is missing an ExternalId or equivalent condition.',
    })
    score += 12
    reasons.push('Cross-account trust without ExternalId')
  } else if (ctx.externalTrust) {
    score += 8
    reasons.push('Cross-account / external trust')
  }

  if (ctx.oidcBroad) {
    findings.push({
      ruleId: 'NHI-AWS-020',
      issueType: 'BROAD_FEDERATION',
      severity: 'HIGH',
      message: 'OIDC/EKS trust is broader than a single repo, environment, or service account.',
    })
    score += 10
    reasons.push('Broad OIDC/EKS trust')
  }

  if (ctx.cicd && ctx.adminAccess) {
    findings.push({
      ruleId: 'NHI-AWS-021',
      issueType: 'EXTERNAL_FEDERATION',
      severity: 'CRITICAL',
      message: 'CI/CD identity can administer production.',
    })
    score += 15
    reasons.push('CI/CD → production admin')
  }

  if (ctx.secretsAccess) {
    findings.push({
      ruleId: 'NHI-AWS-012',
      issueType: 'KEY_VAULT_ACCESS',
      severity: ctx.adminAccess ? 'HIGH' : 'HIGH',
      message: 'NHI can read Secrets Manager secrets.',
    })
    score += 10
    reasons.push('Secrets Manager access')
  }

  if (ctx.kmsAccess) {
    findings.push({
      ruleId: 'NHI-AWS-013',
      issueType: 'EXCESS_PERMISSIONS',
      severity: 'HIGH',
      message: 'NHI can use KMS keys (kms:* or Decrypt at broad scope).',
    })
    score += 8
    reasons.push('KMS access')
  }

  if (ctx.publicWorkload && ctx.adminAccess) {
    findings.push({
      ruleId: 'NHI-AWS-014',
      issueType: 'EXCESS_PERMISSIONS',
      severity: 'CRITICAL',
      message: 'Public workload is attached to a privileged IAM role.',
    })
    score += 16
    reasons.push('Public workload + privileged role')
  }

  if (!ctx.hasOwner && ctx.kind !== 'service-linked') {
    findings.push({
      ruleId: 'NHI-AWS-015',
      issueType: 'NO_OWNER',
      severity: ctx.adminAccess ? 'HIGH' : 'MEDIUM',
      message: 'Production NHI has no owner tag or assigned owner.',
    })
    score += 5
    reasons.push('No owner')
  }

  const dormant = ctx.lastUsedDays != null && ctx.lastUsedDays > 60
  if (dormant && (ctx.adminAccess || ctx.hasAccessKey)) {
    findings.push({
      ruleId: 'NHI-AWS-016',
      issueType: 'STALE_ACCOUNT',
      severity: 'HIGH',
      message: 'Privileged or keyed NHI appears dormant.',
    })
    score += 10
    reasons.push('Dormant privileged NHI')
  } else if (dormant) {
    score += 4
    reasons.push('Unused 60+ days')
  }

  if (!ctx.hasAccessKey && !ctx.wildcardTrust && !ctx.adminAccess && ctx.workloadCount > 0) {
    reasons.push('Temporary STS / role credentials')
    score -= 6
  }

  score = Math.max(0, Math.min(100, Math.round(score)))
  const level = score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW'
  const privilegeLevel: 'ADMIN' | 'ELEVATED' | 'STANDARD' | 'READ_ONLY' =
    ctx.adminAccess || ctx.iamStar ? 'ADMIN' : (ctx.powerUser || ctx.secretsAccess || ctx.passRole) ? 'ELEVATED' : 'STANDARD'

  return {
    score,
    level,
    privilegeLevel,
    breadthScore: Math.min(100, (ctx.adminAccess ? 70 : 20) + ctx.workloadCount * 8 + (ctx.externalTrust ? 15 : 0)),
    findings: findings.filter((f) => !f.informational || ctx.kind === 'service-linked'),
    reasons: [...new Set(reasons)],
  }
}
