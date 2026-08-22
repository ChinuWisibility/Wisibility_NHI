import { STSClient, GetCallerIdentityCommand, AssumeRoleCommand } from '@aws-sdk/client-sts'
import {
  IAMClient,
  paginateListUsers,
  paginateListRoles,
  paginateListAccessKeys,
  GetAccessKeyLastUsedCommand,
  ListAttachedUserPoliciesCommand,
  ListUserPoliciesCommand,
  ListAttachedRolePoliciesCommand,
  ListRolePoliciesCommand,
  GetLoginProfileCommand,
  GetRoleCommand,
  ListInstanceProfilesCommand,
} from '@aws-sdk/client-iam'
import { EC2Client, paginateDescribeInstances } from '@aws-sdk/client-ec2'
import { LambdaClient, paginateListFunctions } from '@aws-sdk/client-lambda'
import { ECSClient, paginateListTaskDefinitions, DescribeTaskDefinitionCommand } from '@aws-sdk/client-ecs'
import { EKSClient, ListClustersCommand, ListPodIdentityAssociationsCommand } from '@aws-sdk/client-eks'
import { SecretsManagerClient, paginateListSecrets } from '@aws-sdk/client-secrets-manager'
import { evaluateAwsRisk, type AwsRiskContext } from './aws-risk.js'

export interface AwsConnectorConfig {
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
  region: string
  roleArn?: string
  externalId?: string
  roleName?: string
}

export interface AwsDiscoveredNHI {
  nhiId: string
  displayName: string
  nhiType: string
  credentialType: string
  status: string
  ownerId?: string
  ownerTeam?: string
  environment: string
  privilegeLevel: string
  breadthScore: number
  isShared: boolean
  isHardcoded: boolean
  vaultPath?: string
  rotationSchedule?: string
  createdAt: string
  sourceConnector: string
  riskScore?: number
  riskLevel?: string
  tags: Record<string, string>
}

export interface AwsFindingRecord {
  issueId: string
  nhiId: string
  nhiName: string
  issueType: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  message: string
  ruleId: string
}

type Creds = { accessKeyId: string; secretAccessKey: string; sessionToken?: string }

function daysSince(iso?: Date | string | null) {
  if (!iso) return undefined
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return undefined
  return Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24))
}

export function parseAwsConfig(raw: unknown): AwsConnectorConfig | null {
  if (!raw || typeof raw !== 'object') return null
  const c = raw as Record<string, unknown>
  const accessKeyId = String(c.accessKeyId ?? '').trim()
  const secretAccessKey = String(c.secretAccessKey ?? '').trim()
  if (!accessKeyId || !secretAccessKey || secretAccessKey.includes('•')) return null
  return {
    accessKeyId,
    secretAccessKey,
    sessionToken: String(c.sessionToken ?? '').trim() || undefined,
    region: String(c.region ?? 'us-east-1').trim() || 'us-east-1',
    roleArn: String(c.roleArn ?? '').trim() || undefined,
    externalId: String(c.externalId ?? '').trim() || undefined,
    roleName: String(c.roleName ?? 'WisibilityNHIReadOnly').trim() || 'WisibilityNHIReadOnly',
  }
}

async function resolveCreds(config: AwsConnectorConfig): Promise<{ creds: Creds; assumed?: string }> {
  const base: Creds = {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    sessionToken: config.sessionToken,
  }
  if (!config.roleArn) return { creds: base }
  const sts = new STSClient({ region: config.region, credentials: base })
  const out = await sts.send(new AssumeRoleCommand({
    RoleArn: config.roleArn,
    RoleSessionName: 'WisibilityNHI',
    ExternalId: config.externalId,
    DurationSeconds: 3600,
  }))
  const c = out.Credentials
  if (!c?.AccessKeyId || !c.SecretAccessKey || !c.SessionToken) {
    throw new Error('AssumeRole did not return credentials')
  }
  return {
    creds: { accessKeyId: c.AccessKeyId, secretAccessKey: c.SecretAccessKey, sessionToken: c.SessionToken },
    assumed: config.roleArn,
  }
}

function clients(region: string, creds: Creds) {
  const cfg = { region, credentials: creds }
  return {
    sts: new STSClient(cfg),
    iam: new IAMClient(cfg),
    ec2: new EC2Client(cfg),
    lambda: new LambdaClient(cfg),
    ecs: new ECSClient(cfg),
    eks: new EKSClient(cfg),
    secrets: new SecretsManagerClient(cfg),
  }
}

export async function testAwsConnection(rawConfig: unknown): Promise<{
  connected: boolean
  latencyMs: number
  error?: string
  tenantName?: string
}> {
  const started = Date.now()
  const config = parseAwsConfig(rawConfig)
  if (!config) {
    return { connected: false, latencyMs: Date.now() - started, error: 'Missing AWS access key ID or secret access key' }
  }
  try {
    const { creds, assumed } = await resolveCreds(config)
    const sts = new STSClient({ region: config.region, credentials: creds })
    const id = await sts.send(new GetCallerIdentityCommand({}))
    return {
      connected: true,
      latencyMs: Date.now() - started,
      tenantName: `account ${id.Account}${assumed ? ' via AssumeRole' : ''} · ${id.Arn}`,
    }
  } catch (err) {
    return {
      connected: false,
      latencyMs: Date.now() - started,
      error: err instanceof Error ? err.message : 'AWS connection failed',
    }
  }
}

function policyNames(attached: { PolicyName?: string; PolicyArn?: string }[], inline: string[]) {
  return [...attached.map((p) => p.PolicyName || p.PolicyArn || ''), ...inline].filter(Boolean)
}

function privilegeFlags(names: string[]) {
  const blob = names.join(' ').toLowerCase()
  return {
    adminAccess: /administratoraccess|iamfullaccess/.test(blob) || names.some((n) => n === '*'),
    powerUser: /poweruseraccess/.test(blob),
    iamStar: /iam\*|iamfullaccess/.test(blob),
    passRole: /passrole|iamfullaccess|administratoraccess/.test(blob),
    assumeRoleStar: /stsfullaccess|administratoraccess/.test(blob),
    secretsAccess: /secretsmanager|administratoraccess/.test(blob),
    kmsAccess: /\bkms\b|administratoraccess/.test(blob),
  }
}

function analyzeTrust(doc?: string, account?: string) {
  let parsed: any = {}
  try { parsed = doc ? JSON.parse(decodeURIComponent(doc)) : {} } catch { parsed = {} }
  const statements = Array.isArray(parsed.Statement) ? parsed.Statement : parsed.Statement ? [parsed.Statement] : []
  const principals: string[] = []
  let wildcardTrust = false
  let externalTrust = false
  let missingExternalId = false
  let oidcTrust = false
  let oidcBroad = false
  let cicd = false
  const services: string[] = []

  for (const s of statements) {
    const p = s.Principal
    const values: string[] = []
    if (p === '*') values.push('*')
    else if (typeof p === 'string') values.push(p)
    else if (p && typeof p === 'object') {
      for (const v of Object.values(p)) {
        if (Array.isArray(v)) values.push(...v.map(String))
        else if (v) values.push(String(v))
      }
    }
    principals.push(...values)
    if (values.includes('*')) wildcardTrust = true
    for (const v of values) {
      if (v.endsWith('.amazonaws.com')) services.push(v)
      if (/token\.actions\.githubusercontent\.com|gitlab|oidc-provider/i.test(v)) {
        oidcTrust = true
        cicd = true
      }
      if (/arn:aws:iam::(\d+):/.test(v)) {
        const other = v.match(/arn:aws:iam::(\d+):/)?.[1]
        if (other && account && other !== account) externalTrust = true
      }
    }
    const cond = JSON.stringify(s.Condition ?? {})
    if (externalTrust && !/externalid/i.test(cond)) missingExternalId = true
    if (oidcTrust && (/['"]\*[ '"]/.test(cond) || !/sub|aud|stringequals/i.test(cond))) oidcBroad = true
    if (/codebuild|codepipeline|codedeploy|cloudformation|terraform|github|gitlab|jenkins/i.test(JSON.stringify(s))) cicd = true
  }

  return { principals, wildcardTrust, externalTrust, missingExternalId, oidcTrust, oidcBroad, cicd, services }
}

function inferEnv(tags: Record<string, string> | undefined, name: string) {
  const hay = `${Object.values(tags ?? {}).join(' ')} ${Object.keys(tags ?? {}).join(' ')} ${name}`.toLowerCase()
  if (/\b(prod|production)\b/.test(hay)) return 'PROD'
  if (/\b(stag|staging)\b/.test(hay)) return 'STAGING'
  if (/\b(test|qa)\b/.test(hay)) return 'TEST'
  return 'DEV'
}

function ownerFromTags(tags?: Record<string, string>) {
  if (!tags) return undefined
  return tags.Owner || tags.owner || tags.ownerEmail || tags.Team || tags.team
}

function tagsFromAws(list?: { Key?: string; Value?: string }[]) {
  const out: Record<string, string> = {}
  for (const t of list ?? []) {
    if (t.Key) out[t.Key] = t.Value ?? ''
  }
  return out
}

export async function discoverAwsNHIs(
  rawConfig: unknown,
  connectorId: string,
): Promise<{ nhis: AwsDiscoveredNHI[]; errors: string[]; findings: AwsFindingRecord[] }> {
  const config = parseAwsConfig(rawConfig)
  if (!config) {
    return { nhis: [], errors: ['AWS connector is missing access key ID or secret access key'], findings: [] }
  }

  const errors: string[] = []
  const { creds } = await resolveCreds(config)
  const api = clients(config.region, creds)
  const ident = await api.sts.send(new GetCallerIdentityCommand({}))
  const account = ident.Account ?? 'unknown'
  const workloadsByRole = new Map<string, string[]>()
  const publicByRole = new Set<string>()
  const ec2ByProfile = new Map<string, { label: string; isPublic: boolean }[]>()

  const addWorkload = (roleArn: string | undefined, label: string, isPublic = false) => {
    if (!roleArn) return
    const list = workloadsByRole.get(roleArn) ?? []
    list.push(label)
    workloadsByRole.set(roleArn, list)
    if (isPublic) publicByRole.add(roleArn)
  }

  try {
    for await (const page of paginateDescribeInstances({ client: api.ec2 }, {})) {
      for (const res of page.Reservations ?? []) {
        for (const inst of res.Instances ?? []) {
          const arn = inst.IamInstanceProfile?.Arn
          if (!arn) continue
          const name = arn.split('/').pop() ?? arn
          const list = ec2ByProfile.get(name) ?? []
          list.push({ label: `ec2:${inst.InstanceId}`, isPublic: Boolean(inst.PublicIpAddress) })
          ec2ByProfile.set(name, list)
        }
      }
    }
  } catch (err) {
    errors.push(`EC2 skipped: ${err instanceof Error ? err.message : 'unknown'}`)
  }

  try {
    for await (const page of paginateListFunctions({ client: api.lambda }, {})) {
      for (const fn of page.Functions ?? []) {
        addWorkload(fn.Role, `lambda:${fn.FunctionName}`)
      }
    }
  } catch (err) {
    errors.push(`Lambda skipped: ${err instanceof Error ? err.message : 'unknown'}`)
  }

  try {
    for await (const page of paginateListTaskDefinitions({ client: api.ecs }, { status: 'ACTIVE' })) {
      for (const arn of page.taskDefinitionArns ?? []) {
        const td = await api.ecs.send(new DescribeTaskDefinitionCommand({ taskDefinition: arn }))
        addWorkload(td.taskDefinition?.taskRoleArn, `ecs-task:${td.taskDefinition?.family}`)
        addWorkload(td.taskDefinition?.executionRoleArn, `ecs-exec:${td.taskDefinition?.family}`)
      }
    }
  } catch (err) {
    errors.push(`ECS skipped: ${err instanceof Error ? err.message : 'unknown'}`)
  }

  try {
    const clusters = await api.eks.send(new ListClustersCommand({}))
    for (const name of clusters.clusters ?? []) {
      const assoc = await api.eks.send(new ListPodIdentityAssociationsCommand({ clusterName: name }))
      for (const a of assoc.associations ?? []) {
        addWorkload(a.roleArn, `eks:${name}/${a.namespace}/${a.serviceAccount}`)
      }
    }
  } catch (err) {
    errors.push(`EKS skipped: ${err instanceof Error ? err.message : 'unknown'}`)
  }

  let secretCount = 0
  try {
    for await (const page of paginateListSecrets({ client: api.secrets }, {})) {
      secretCount += page.SecretList?.length ?? 0
    }
  } catch (err) {
    errors.push(`Secrets Manager metadata skipped: ${err instanceof Error ? err.message : 'unknown'}`)
  }

  const profiles: { name: string; roles: string[] }[] = []
  try {
    const listed = await api.iam.send(new ListInstanceProfilesCommand({ MaxItems: 200 }))
    for (const p of listed.InstanceProfiles ?? []) {
      const name = p.InstanceProfileName ?? ''
      profiles.push({ name, roles: (p.Roles ?? []).map((r) => r.Arn ?? '') })
      for (const r of p.Roles ?? []) {
        addWorkload(r.Arn, `instance-profile:${name}`)
        for (const attach of ec2ByProfile.get(name) ?? []) addWorkload(r.Arn, attach.label, attach.isPublic)
      }
    }
  } catch (err) {
    errors.push(`Instance profiles skipped: ${err instanceof Error ? err.message : 'unknown'}`)
  }

  const nhis: AwsDiscoveredNHI[] = []
  const findings: AwsFindingRecord[] = []

  const emit = (input: {
    id: string
    name: string
    kind: AwsRiskContext['kind']
    created?: Date
    tags?: Record<string, string>
    policies: string[]
    trust?: ReturnType<typeof analyzeTrust>
    keys?: { ageDays?: number; unusedDays?: number; count: number }
    lastUsedDays?: number | null
    arn: string
  }) => {
    const flags = privilegeFlags(input.policies)
    const workloads = workloadsByRole.get(input.arn) ?? []
    const owner = ownerFromTags(input.tags)
    const ctx: AwsRiskContext = {
      displayName: input.name,
      kind: input.kind,
      hasAccessKey: (input.keys?.count ?? 0) > 0,
      keyAgeDays: input.keys?.ageDays,
      unusedKeyDays: input.keys?.unusedDays,
      multipleKeys: (input.keys?.count ?? 0) > 1,
      adminAccess: flags.adminAccess,
      powerUser: flags.powerUser,
      iamStar: flags.iamStar,
      passRole: flags.passRole,
      assumeRoleStar: flags.assumeRoleStar,
      secretsAccess: flags.secretsAccess,
      kmsAccess: flags.kmsAccess,
      wildcardTrust: input.trust?.wildcardTrust ?? false,
      externalTrust: input.trust?.externalTrust ?? false,
      missingExternalId: input.trust?.missingExternalId ?? false,
      oidcTrust: input.trust?.oidcTrust ?? false,
      oidcBroad: input.trust?.oidcBroad ?? false,
      cicd: input.trust?.cicd ?? /github|gitlab|codebuild|jenkins|oidc/i.test(input.name),
      publicWorkload: publicByRole.has(input.arn),
      lastUsedDays: input.lastUsedDays,
      hasOwner: Boolean(owner),
      workloadCount: workloads.length,
    }
    const evaluated = evaluateAwsRisk(ctx)
    const dormant = (input.lastUsedDays != null && input.lastUsedDays > 60) || input.kind === 'user' && (input.keys?.unusedDays ?? 0) > 90

    let nhiType = 'IAM_ROLE'
    let credentialType = 'TOKEN'
    if (input.kind === 'user') {
      nhiType = 'SERVICE_ACCOUNT'
      credentialType = 'API_KEY'
    } else if (input.trust?.oidcTrust) {
      nhiType = 'OIDC'
      credentialType = 'TOKEN'
    } else if (input.kind === 'service-linked') {
      nhiType = 'IAM_ROLE'
      credentialType = 'TOKEN'
    }

    const nhiId = `aws-${account}-${input.id}`.slice(0, 80)
    nhis.push({
      nhiId,
      displayName: input.name,
      nhiType,
      credentialType,
      status: dormant ? 'DORMANT' : 'ACTIVE',
      ownerTeam: owner,
      environment: inferEnv(input.tags, input.name),
      privilegeLevel: evaluated.privilegeLevel,
      breadthScore: evaluated.breadthScore,
      isShared: workloads.length > 1,
      isHardcoded: (input.keys?.count ?? 0) > 0,
      vaultPath: input.kind === 'user' ? undefined : 'aws/sts',
      rotationSchedule: (input.keys?.count ?? 0) > 0 ? 'manual-access-key' : undefined,
      createdAt: input.created?.toISOString() || new Date().toISOString(),
      sourceConnector: connectorId,
      riskScore: evaluated.score,
      riskLevel: evaluated.level,
      tags: {
        platform: 'aws',
        account,
        region: config.region,
        arn: input.arn,
        aws_kind: input.kind,
        policies: input.policies.join(' | '),
        trust_principals: (input.trust?.principals ?? []).join(' | '),
        trust_services: (input.trust?.services ?? []).join(' | '),
        workloads: workloads.join(' | '),
        access_key_count: String(input.keys?.count ?? 0),
        key_age_days: input.keys?.ageDays != null ? String(input.keys.ageDays) : '',
        last_used_days: input.lastUsedDays != null ? String(input.lastUsedDays) : '',
        secrets_in_account: String(secretCount),
        findings: evaluated.findings.map((f) => f.ruleId).join(','),
        risk_reasons: evaluated.reasons.join(' | '),
        instance_profiles: profiles.filter((p) => p.roles.includes(input.arn)).map((p) => p.name).join(' | '),
      },
    })

    for (const f of evaluated.findings) {
      if (f.informational) continue
      findings.push({
        issueId: `${f.ruleId}:${nhiId}`.slice(0, 80),
        nhiId,
        nhiName: input.name,
        issueType: f.issueType,
        severity: f.severity,
        message: f.message,
        ruleId: f.ruleId,
      })
    }
  }

  try {
    for await (const page of paginateListUsers({ client: api.iam }, {})) {
      for (const user of page.Users ?? []) {
        if (!user.UserName) continue
        const attached = await api.iam.send(new ListAttachedUserPoliciesCommand({ UserName: user.UserName }))
        const inline = await api.iam.send(new ListUserPoliciesCommand({ UserName: user.UserName }))
        const keys: { ageDays?: number; unusedDays?: number; count: number } = { count: 0 }
        try {
          for await (const kpage of paginateListAccessKeys({ client: api.iam }, { UserName: user.UserName })) {
            for (const k of kpage.AccessKeyMetadata ?? []) {
              if (k.Status !== 'Active') continue
              keys.count += 1
              keys.ageDays = Math.max(keys.ageDays ?? 0, daysSince(k.CreateDate) ?? 0)
              if (k.AccessKeyId) {
                try {
                  const last = await api.iam.send(new GetAccessKeyLastUsedCommand({ AccessKeyId: k.AccessKeyId }))
                  const unused = daysSince(last.AccessKeyLastUsed?.LastUsedDate)
                  if (unused != null) keys.unusedDays = Math.max(keys.unusedDays ?? 0, unused)
                } catch { /* last-used is optional */ }
              }
            }
          }
        } catch (err) {
          errors.push(`Access keys for ${user.UserName} skipped: ${err instanceof Error ? err.message : 'unknown'}`)
        }
        let lastUsedDays: number | null = keys.unusedDays ?? null
        try {
          await api.iam.send(new GetLoginProfileCommand({ UserName: user.UserName }))
        } catch {
          // no console login — typical service account
        }
        emit({
          id: `user-${user.UserName}`,
          name: user.UserName,
          kind: 'user',
          created: user.CreateDate,
          tags: tagsFromAws((user as { Tags?: { Key?: string; Value?: string }[] }).Tags),
          policies: policyNames(attached.AttachedPolicies ?? [], inline.PolicyNames ?? []),
          keys,
          lastUsedDays,
          arn: user.Arn ?? `arn:aws:iam::${account}:user/${user.UserName}`,
        })
      }
    }
  } catch (err) {
    errors.push(`IAM users skipped: ${err instanceof Error ? err.message : 'unknown'}`)
  }

  try {
    for await (const page of paginateListRoles({ client: api.iam }, {})) {
      for (const role of page.Roles ?? []) {
        if (!role.RoleName || !role.Arn) continue
        const serviceLinked = role.Path?.includes('/aws-service-role/') || role.RoleName.startsWith('AWSServiceRole')
        const attached = await api.iam.send(new ListAttachedRolePoliciesCommand({ RoleName: role.RoleName }))
        const inline = await api.iam.send(new ListRolePoliciesCommand({ RoleName: role.RoleName }))
        let trustDoc = role.AssumeRolePolicyDocument
        try {
          const full = await api.iam.send(new GetRoleCommand({ RoleName: role.RoleName }))
          trustDoc = full.Role?.AssumeRolePolicyDocument ?? trustDoc
        } catch { /* list payload is enough */ }
        emit({
          id: `role-${role.RoleName}`,
          name: role.RoleName,
          kind: serviceLinked ? 'service-linked' : 'role',
          created: role.CreateDate,
          tags: tagsFromAws((role as { Tags?: { Key?: string; Value?: string }[] }).Tags),
          policies: policyNames(attached.AttachedPolicies ?? [], inline.PolicyNames ?? []),
          trust: analyzeTrust(trustDoc, account),
          lastUsedDays: daysSince(role.RoleLastUsed?.LastUsedDate) ?? null,
          arn: role.Arn,
        })
      }
    }
  } catch (err) {
    errors.push(`IAM roles skipped: ${err instanceof Error ? err.message : 'unknown'}`)
  }

  return { nhis, errors, findings }
}
