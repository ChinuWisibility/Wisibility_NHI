import { IdentityClient } from 'oci-identity'
import { ComputeClient } from 'oci-core'
import { Region, SimpleAuthenticationDetailsProvider } from 'oci-common'
import { evaluateOciRisk, type OciRiskContext } from './oci-risk.js'

export interface OciConnectorConfig {
  tenancyOcid: string
  userOcid: string
  fingerprint: string
  privateKey: string
  passphrase?: string
  region: string
  compartmentOcid?: string
}

export interface OciDiscoveredNHI {
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

export interface OciFindingRecord {
  issueId: string
  nhiId: string
  nhiName: string
  issueType: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  message: string
  ruleId: string
}

interface ParsedPolicy {
  principalType: 'group' | 'dynamic-group' | 'any-user' | 'any-group' | 'other'
  principalName: string
  verb: string
  resource: string
  tenancyScope: boolean
  raw: string
  policyName: string
}

interface Privilege {
  statements: string[]
  adminAccess: boolean
  iamManage: boolean
  secretsAccess: boolean
  tenancyScope: boolean
  anyUserPolicy: boolean
}

interface Named {
  id?: string
  name?: string
  description?: string
  timeCreated?: Date
  lifecycleState?: string
  freeformTags?: Record<string, string>
  definedTags?: Record<string, Record<string, string>>
}

interface UserLike extends Named {
  email?: string
  isMfaActivated?: boolean
  lastSuccessfulLoginTime?: Date
}

interface KeyLike {
  fingerprint?: string
  keyId?: string
  id?: string
  displayName?: string
  description?: string
  timeCreated?: Date
  timeExpires?: Date
  lifecycleState?: string
}

interface Membership {
  userId?: string
  groupId?: string
}

interface PolicyLike extends Named {
  statements?: string[]
  compartmentId?: string
}

interface DynamicGroupLike extends Named {
  matchingRule?: string
}

interface IdpLike extends Named {
  protocol?: string
  productType?: string
}

interface InstanceLike {
  id?: string
  displayName?: string
  compartmentId?: string
  lifecycleState?: string
  timeCreated?: Date
}

function daysSince(iso?: Date | string | null) {
  if (!iso) return undefined
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return undefined
  return Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24))
}

function normalizePem(raw: string) {
  return raw.replace(/\\n/g, '\n').replace(/\r\n/g, '\n').trim()
}

function resolveRegion(regionId: string) {
  return Region.fromRegionId(regionId)
}

export function parseOciConfig(raw: unknown): OciConnectorConfig | null {
  if (!raw || typeof raw !== 'object') return null
  const c = raw as Record<string, unknown>
  const tenancyOcid = String(c.tenancyOcid ?? '').trim()
  const userOcid = String(c.userOcid ?? '').trim()
  const fingerprint = String(c.fingerprint ?? '').trim()
  const privateKey = normalizePem(String(c.privateKey ?? ''))
  if (!tenancyOcid || !userOcid || !fingerprint || !privateKey || privateKey.includes('•')) return null
  const passphrase = String(c.passphrase ?? '').trim()
  const compartmentOcid = String(c.compartmentOcid ?? '').trim()
  return {
    tenancyOcid,
    userOcid,
    fingerprint,
    privateKey,
    passphrase: passphrase && !passphrase.includes('•') ? passphrase : undefined,
    region: String(c.region ?? 'us-ashburn-1').trim() || 'us-ashburn-1',
    compartmentOcid: compartmentOcid || undefined,
  }
}

function provider(config: OciConnectorConfig) {
  return new SimpleAuthenticationDetailsProvider(
    config.tenancyOcid,
    config.userOcid,
    config.fingerprint,
    config.privateKey,
    config.passphrase ?? null,
    resolveRegion(config.region),
  )
}

async function listAll<T>(fn: (page?: string) => Promise<{ items?: T[]; opcNextPage?: string }>): Promise<T[]> {
  const items: T[] = []
  let page: string | undefined
  for (let n = 0; n < 50; n++) {
    const res = await fn(page)
    items.push(...(res.items ?? []))
    page = res.opcNextPage || undefined
    if (!page) break
  }
  return items
}

function flattenTags(freeform?: Record<string, string>, defined?: Record<string, Record<string, string>>) {
  const out: Record<string, string> = { ...(freeform ?? {}) }
  for (const ns of Object.values(defined ?? {})) {
    for (const [k, v] of Object.entries(ns ?? {})) out[k] = String(v)
  }
  return out
}

function ownerFromTags(tags: Record<string, string>) {
  return tags.Owner || tags.owner || tags.ownerEmail || tags.Team || tags.team
}

function inferEnv(tags: Record<string, string>, name: string) {
  const hay = `${Object.values(tags).join(' ')} ${Object.keys(tags).join(' ')} ${name}`.toLowerCase()
  if (/\b(prod|production|nhi-lab)\b/.test(hay)) return 'PROD'
  if (/\b(stag|staging)\b/.test(hay)) return 'STAGING'
  if (/\b(test|qa)\b/.test(hay)) return 'TEST'
  return 'DEV'
}

function parsePolicyStatement(policyName: string, stmt: string): ParsedPolicy | null {
  const m = stmt.match(
    /^Allow\s+(group|dynamic-group|any-user|any-group)\s+("[^"]+"|\S+)\s+to\s+(\S+)\s+(\S+)(?:\s+in\s+(tenancy|compartment\b.*))?/i,
  )
  if (!m) return null
  const principalType = m[1].toLowerCase() as ParsedPolicy['principalType']
  return {
    principalType,
    principalName: m[2].replace(/^"|"$/g, ''),
    verb: m[3].toLowerCase(),
    resource: m[4].toLowerCase(),
    tenancyScope: /tenancy/i.test(m[5] ?? ''),
    raw: stmt,
    policyName,
  }
}

function emptyPrivilege(): Privilege {
  return {
    statements: [],
    adminAccess: false,
    iamManage: false,
    secretsAccess: false,
    tenancyScope: false,
    anyUserPolicy: false,
  }
}

function applyParsed(priv: Privilege, p: ParsedPolicy) {
  priv.statements.push(`${p.policyName}: ${p.raw}`)
  if (p.tenancyScope) priv.tenancyScope = true
  if (p.principalType === 'any-user') priv.anyUserPolicy = true
  const adminResource = p.resource === 'all-resources' || p.resource === 'tenancies'
  const iamResource = /users|groups|policies|dynamic-groups|identity-providers/.test(p.resource)
  const secretResource = /secret|vault|keys/.test(p.resource)
  if (p.verb === 'manage' && adminResource) priv.adminAccess = true
  if (p.verb === 'manage' && iamResource) priv.iamManage = true
  if ((p.verb === 'manage' || p.verb === 'use') && secretResource) priv.secretsAccess = true
}

function mergePrivilege(a: Privilege, b: Privilege): Privilege {
  return {
    statements: [...a.statements, ...b.statements],
    adminAccess: a.adminAccess || b.adminAccess,
    iamManage: a.iamManage || b.iamManage,
    secretsAccess: a.secretsAccess || b.secretsAccess,
    tenancyScope: a.tenancyScope || b.tenancyScope,
    anyUserPolicy: a.anyUserPolicy || b.anyUserPolicy,
  }
}

function isBroadMatchingRule(rule: string, tenancyOcid: string) {
  const r = rule.toLowerCase()
  if (!rule.trim()) return true
  if (r.includes(tenancyOcid.toLowerCase())) return true
  if (/instance\.compartment\.id\s*=\s*['"]?ocid1\.tenancy/i.test(rule)) return true
  if (/\bany\s*\{/.test(r) && !/instance\.id|resource\.id/i.test(rule)) {
    const compartments = rule.match(/instance\.compartment\.id/gi) ?? []
    if (compartments.length === 0) return true
  }
  return false
}

function looksLikeServiceUser(name: string, tags: Record<string, string>, hasMachineCreds: boolean) {
  if (hasMachineCreds) return true
  const hay = `${name} ${Object.values(tags).join(' ')}`.toLowerCase()
  return /\b(nhi-lab|svc-|sa-|bot-|workload|automation|deploy|ci-)\b/.test(hay)
}

function shortId(ocid: string, fallback: string) {
  const parts = ocid.split('.')
  return (parts[parts.length - 1] || fallback).slice(-24)
}

export async function testOciConnection(rawConfig: unknown): Promise<{
  connected: boolean
  latencyMs: number
  error?: string
  tenantName?: string
}> {
  const started = Date.now()
  const config = parseOciConfig(rawConfig)
  if (!config) {
    return {
      connected: false,
      latencyMs: Date.now() - started,
      error: 'Missing tenancy OCID, user OCID, fingerprint, or API private key',
    }
  }
  if (!config.privateKey.includes('BEGIN')) {
    return {
      connected: false,
      latencyMs: Date.now() - started,
      error: 'Paste the full PEM private key, including the BEGIN / END lines (not the public key or fingerprint).',
    }
  }
  try {
    const ident = new IdentityClient({ authenticationDetailsProvider: provider(config) })
    const tenancy = await ident.getTenancy({ tenancyId: config.tenancyOcid })
    const name = tenancy.tenancy.name || 'OCI tenancy'
    return {
      connected: true,
      latencyMs: Date.now() - started,
      tenantName: `${name} · ${config.region}`,
    }
  } catch (err) {
    const raw = err instanceof Error ? err.message : 'OCI connection failed'
    return { connected: false, latencyMs: Date.now() - started, error: raw.slice(0, 400) }
  }
}

export async function discoverOciNHIs(
  rawConfig: unknown,
  connectorId: string,
): Promise<{ nhis: OciDiscoveredNHI[]; errors: string[]; findings: OciFindingRecord[] }> {
  const config = parseOciConfig(rawConfig)
  if (!config) {
    return { nhis: [], errors: ['OCI connector is missing tenancy OCID, user OCID, fingerprint, or private key'], findings: [] }
  }

  const errors: string[] = []
  const ident = new IdentityClient({ authenticationDetailsProvider: provider(config) })
  const tenancyId = config.tenancyOcid
  const rootCompartment = config.compartmentOcid || tenancyId

  const groupById = new Map<string, Named>()
  const groupsByUser = new Map<string, string[]>()
  const privilegeByGroup = new Map<string, Privilege>()
  const privilegeByDynamicGroup = new Map<string, Privilege>()
  const anyUserPriv = emptyPrivilege()

  try {
    const groups = await listAll<Named>((page) => ident.listGroups({ compartmentId: tenancyId, page, limit: 100 }))
    for (const g of groups) if (g.id && g.name) groupById.set(g.id, g)
  } catch (err) {
    errors.push(`Groups skipped: ${err instanceof Error ? err.message : 'unknown'}`)
  }

  try {
    const memberships = await listAll<Membership>((page) =>
      ident.listUserGroupMemberships({ compartmentId: tenancyId, page, limit: 100 }),
    )
    for (const m of memberships) {
      if (!m.userId || !m.groupId) continue
      const name = groupById.get(m.groupId)?.name
      if (!name) continue
      const list = groupsByUser.get(m.userId) ?? []
      list.push(name)
      groupsByUser.set(m.userId, list)
    }
  } catch (err) {
    errors.push(`Group memberships skipped: ${err instanceof Error ? err.message : 'unknown'}`)
  }

  const compartments: Named[] = [{ id: tenancyId, name: 'tenancy' }]
  try {
    const listed = await listAll<Named>((page) =>
      ident.listCompartments({
        compartmentId: tenancyId,
        compartmentIdInSubtree: true,
        accessLevel: 'ACCESSIBLE',
        page,
        limit: 100,
      }),
    )
    compartments.push(...listed.filter((c) => c.id && c.lifecycleState !== 'DELETED'))
  } catch (err) {
    errors.push(`Compartments skipped: ${err instanceof Error ? err.message : 'unknown'}`)
  }

  const policyCompartments = config.compartmentOcid
    ? compartments.filter((c) => c.id === config.compartmentOcid || c.id === tenancyId)
    : compartments

  for (const compartment of policyCompartments) {
    if (!compartment.id) continue
    try {
      const policies = await listAll<PolicyLike>((page) =>
        ident.listPolicies({ compartmentId: compartment.id, page, limit: 100 }),
      )
      for (const policy of policies) {
        for (const stmt of policy.statements ?? []) {
          const parsed = parsePolicyStatement(policy.name ?? 'policy', stmt)
          if (!parsed) continue
          if (parsed.principalType === 'any-user') applyParsed(anyUserPriv, parsed)
          const target =
            parsed.principalType === 'dynamic-group' ? privilegeByDynamicGroup : privilegeByGroup
          if (parsed.principalType === 'group' || parsed.principalType === 'dynamic-group') {
            const prev = target.get(parsed.principalName) ?? emptyPrivilege()
            applyParsed(prev, parsed)
            target.set(parsed.principalName, prev)
          }
        }
      }
    } catch (err) {
      errors.push(`Policies in ${compartment.name ?? compartment.id} skipped: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  }

  const instances: InstanceLike[] = []
  try {
    const compute = new ComputeClient({ authenticationDetailsProvider: provider(config) })
    const computeCompartments = config.compartmentOcid
      ? compartments.filter((c) => c.id === rootCompartment)
      : compartments
    for (const compartment of computeCompartments) {
      if (!compartment.id) continue
      try {
        const listed = await listAll<InstanceLike>((page) =>
          compute.listInstances({ compartmentId: compartment.id, page, limit: 100 }),
        )
        instances.push(...listed.filter((i) => i.lifecycleState !== 'TERMINATED'))
      } catch (err) {
        errors.push(`Compute in ${compartment.name ?? compartment.id} skipped: ${err instanceof Error ? err.message : 'unknown'}`)
      }
    }
  } catch (err) {
    errors.push(`Compute skipped: ${err instanceof Error ? err.message : 'unknown'}`)
  }

  const workloadsByDynamicGroup = new Map<string, string[]>()
  const matchInstance = (rule: string, inst: InstanceLike) => {
    if (inst.id && rule.includes(inst.id)) return true
    if (inst.compartmentId && rule.includes(inst.compartmentId)) return true
    return false
  }

  const nhis: OciDiscoveredNHI[] = []
  const findings: OciFindingRecord[] = []

  const emit = (input: {
    id: string
    name: string
    kind: OciRiskContext['kind']
    created?: Date
    tags?: Record<string, string>
    ocid: string
    groups?: string[]
    policies: Privilege
    matchingRule?: string
    apiKeys?: { count: number; ageDays?: number }
    authTokens?: number
    customerSecretKeys?: number
    lastUsedDays?: number | null
    inactive?: boolean
    protocol?: string
  }) => {
    const owner = ownerFromTags(input.tags ?? {})
    const workloads = workloadsByDynamicGroup.get(input.name) ?? workloadsByDynamicGroup.get(input.ocid) ?? []
    const broadMatchingRule = input.kind === 'dynamic-group' && isBroadMatchingRule(input.matchingRule ?? '', tenancyId)
    const ctx: OciRiskContext = {
      displayName: input.name,
      kind: input.kind,
      hasApiKey: (input.apiKeys?.count ?? 0) > 0,
      apiKeyCount: input.apiKeys?.count ?? 0,
      keyAgeDays: input.apiKeys?.ageDays,
      authTokenCount: input.authTokens ?? 0,
      customerSecretKeyCount: input.customerSecretKeys ?? 0,
      adminAccess: input.policies.adminAccess,
      iamManage: input.policies.iamManage,
      secretsAccess: input.policies.secretsAccess,
      tenancyScope: input.policies.tenancyScope,
      broadMatchingRule,
      anyUserPolicy: input.policies.anyUserPolicy,
      federated: input.kind === 'identity-provider',
      cicd: /github|gitlab|jenkins|oidc|ci-cd|deploy/i.test(`${input.name} ${input.protocol ?? ''}`),
      lastUsedDays: input.lastUsedDays,
      hasOwner: Boolean(owner),
      workloadCount: workloads.length,
      inactive: Boolean(input.inactive),
    }
    const evaluated = evaluateOciRisk(ctx)
    const dormant = ctx.inactive || (ctx.lastUsedDays != null && ctx.lastUsedDays > 60)

    let nhiType = 'SERVICE_ACCOUNT'
    let credentialType = 'API_KEY'
    if (input.kind === 'dynamic-group') {
      nhiType = 'IAM_ROLE'
      credentialType = 'TOKEN'
    } else if (input.kind === 'identity-provider') {
      nhiType = 'OIDC'
      credentialType = 'TOKEN'
    }

    const nhiId = `oci-${input.id}`.slice(0, 80)
    nhis.push({
      nhiId,
      displayName: input.name,
      nhiType,
      credentialType,
      status: dormant ? 'DORMANT' : 'ACTIVE',
      ownerTeam: owner,
      environment: inferEnv(input.tags ?? {}, input.name),
      privilegeLevel: evaluated.privilegeLevel,
      breadthScore: evaluated.breadthScore,
      isShared: workloads.length > 1 || (input.groups?.length ?? 0) > 2,
      isHardcoded: (input.apiKeys?.count ?? 0) + (input.authTokens ?? 0) + (input.customerSecretKeys ?? 0) > 0,
      vaultPath: input.kind === 'dynamic-group' ? 'oci/instance-principal' : undefined,
      rotationSchedule: (input.apiKeys?.count ?? 0) > 0 ? 'manual-api-key' : undefined,
      createdAt: input.created?.toISOString() || new Date().toISOString(),
      sourceConnector: connectorId,
      riskScore: evaluated.score,
      riskLevel: evaluated.level,
      tags: {
        platform: 'oci',
        tenancy: tenancyId,
        region: config.region,
        ocid: input.ocid,
        oci_kind: input.kind,
        groups: (input.groups ?? []).join(' | '),
        policies: input.policies.statements.join(' | '),
        matching_rule: input.matchingRule ?? '',
        workloads: workloads.join(' | '),
        api_key_count: String(input.apiKeys?.count ?? 0),
        auth_token_count: String(input.authTokens ?? 0),
        customer_secret_key_count: String(input.customerSecretKeys ?? 0),
        key_age_days: input.apiKeys?.ageDays != null ? String(input.apiKeys.ageDays) : '',
        last_used_days: input.lastUsedDays != null ? String(input.lastUsedDays) : '',
        protocol: input.protocol ?? '',
        findings: evaluated.findings.map((f) => f.ruleId).join(','),
        risk_reasons: evaluated.reasons.join(' | '),
      },
    })

    for (const f of evaluated.findings) {
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
    const users = await listAll<UserLike>((page) => ident.listUsers({ compartmentId: tenancyId, page, limit: 100 }))
    for (const user of users) {
      if (!user.id || !user.name) continue
      const tags = flattenTags(user.freeformTags, user.definedTags)
      let apiKeys: KeyLike[] = []
      let authTokens: KeyLike[] = []
      let secretKeys: KeyLike[] = []
      try {
        apiKeys = (await ident.listApiKeys({ userId: user.id })).items ?? []
      } catch (err) {
        errors.push(`API keys for ${user.name} skipped: ${err instanceof Error ? err.message : 'unknown'}`)
      }
      try {
        authTokens = (await ident.listAuthTokens({ userId: user.id })).items ?? []
      } catch (err) {
        errors.push(`Auth tokens for ${user.name} skipped: ${err instanceof Error ? err.message : 'unknown'}`)
      }
      try {
        secretKeys = (await ident.listCustomerSecretKeys({ userId: user.id })).items ?? []
      } catch (err) {
        errors.push(`Customer secret keys for ${user.name} skipped: ${err instanceof Error ? err.message : 'unknown'}`)
      }

      const activeKeys = apiKeys.filter((k) => !k.lifecycleState || k.lifecycleState === 'ACTIVE')
      const hasMachineCreds = activeKeys.length + authTokens.length + secretKeys.length > 0
      if (!looksLikeServiceUser(user.name, tags, hasMachineCreds)) continue

      const groupNames = groupsByUser.get(user.id) ?? []
      let priv = emptyPrivilege()
      for (const g of groupNames) priv = mergePrivilege(priv, privilegeByGroup.get(g) ?? emptyPrivilege())
      priv = mergePrivilege(priv, anyUserPriv)

      emit({
        id: `user-${shortId(user.id, user.name)}`,
        name: user.name,
        kind: 'user',
        created: user.timeCreated,
        tags,
        ocid: user.id,
        groups: groupNames,
        policies: priv,
        apiKeys: {
          count: activeKeys.length,
          ageDays: activeKeys.reduce((max, k) => Math.max(max, daysSince(k.timeCreated) ?? 0), 0) || undefined,
        },
        authTokens: authTokens.length,
        customerSecretKeys: secretKeys.length,
        lastUsedDays: daysSince(user.lastSuccessfulLoginTime) ?? null,
        inactive: user.lifecycleState === 'INACTIVE',
      })
    }
  } catch (err) {
    errors.push(`IAM users skipped: ${err instanceof Error ? err.message : 'unknown'}`)
  }

  try {
    const dynGroups = await listAll<DynamicGroupLike>((page) =>
      ident.listDynamicGroups({ compartmentId: tenancyId, page, limit: 100 }),
    )
    for (const dg of dynGroups) {
      if (!dg.id || !dg.name) continue
      const rule = dg.matchingRule ?? ''
      const workloads = instances.filter((i) => matchInstance(rule, i)).map((i) => `instance:${i.displayName || i.id}`)
      workloadsByDynamicGroup.set(dg.name, workloads)
      const tags = flattenTags(dg.freeformTags, dg.definedTags)
      emit({
        id: `dg-${shortId(dg.id, dg.name)}`,
        name: dg.name,
        kind: 'dynamic-group',
        created: dg.timeCreated,
        tags,
        ocid: dg.id,
        policies: mergePrivilege(privilegeByDynamicGroup.get(dg.name) ?? emptyPrivilege(), anyUserPriv),
        matchingRule: rule,
        lastUsedDays: null,
        inactive: dg.lifecycleState === 'INACTIVE',
      })
    }
  } catch (err) {
    errors.push(`Dynamic groups skipped: ${err instanceof Error ? err.message : 'unknown'}`)
  }

  try {
    const idps = await listAll<IdpLike>((page) =>
      ident.listIdentityProviders({ protocol: 'SAML2', compartmentId: tenancyId, page, limit: 100 }),
    )
    for (const idp of idps) {
      if (!idp.id || !idp.name) continue
      emit({
        id: `idp-${shortId(idp.id, idp.name)}`,
        name: idp.name,
        kind: 'identity-provider',
        created: idp.timeCreated,
        tags: flattenTags(idp.freeformTags, idp.definedTags),
        ocid: idp.id,
        policies: emptyPrivilege(),
        protocol: idp.protocol || idp.productType,
        lastUsedDays: null,
      })
    }
  } catch (err) {
    errors.push(`Identity providers skipped: ${err instanceof Error ? err.message : 'unknown'}`)
  }

  return { nhis, errors, findings }
}
