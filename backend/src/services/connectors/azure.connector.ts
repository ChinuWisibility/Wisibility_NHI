import { evaluateAzureRisk, type AzureRiskContext } from './azure-risk.js'

export interface AzureConnectorConfig {
  tenantId: string
  clientId: string
  clientSecret: string
  subscriptionId?: string
}

export interface AzureDiscoveredNHI {
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
  certExpiry?: string
  createdAt: string
  sourceConnector: string
  riskScore?: number
  riskLevel?: string
  tags: Record<string, string>
}

export interface AzureFindingRecord {
  issueId: string
  nhiId: string
  nhiName: string
  issueType: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  message: string
  ruleId: string
}

interface GraphCred {
  endDateTime?: string
  startDateTime?: string
  displayName?: string
  hint?: string
  type?: string
}

interface GraphApp {
  id: string
  appId?: string
  displayName?: string
  createdDateTime?: string
  signInAudience?: string
  tags?: string[]
  passwordCredentials?: GraphCred[]
  keyCredentials?: GraphCred[]
  owners?: { id?: string; displayName?: string; userPrincipalName?: string }[]
}

interface GraphSP {
  id: string
  appId?: string
  displayName?: string
  servicePrincipalType?: string
  accountEnabled?: boolean
  createdDateTime?: string
  appOwnerOrganizationId?: string
  tags?: string[]
  passwordCredentials?: GraphCred[]
  keyCredentials?: GraphCred[]
  owners?: { id?: string; displayName?: string; userPrincipalName?: string }[]
  signInActivity?: { lastSignInDateTime?: string }
}

interface FederatedCred {
  id?: string
  name?: string
  issuer?: string
  subject?: string
  audiences?: string[]
  description?: string
}

interface ArmRoleAssignment {
  properties?: { principalId?: string; roleDefinitionId?: string; scope?: string }
}

interface ArmRoleDefinition {
  id?: string
  properties?: { roleName?: string }
}

interface ArmIdentity {
  type?: string
  principalId?: string
  userAssignedIdentities?: Record<string, { principalId?: string; clientId?: string }>
}

interface ArmResource {
  id?: string
  name?: string
  type?: string
  location?: string
  tags?: Record<string, string>
  identity?: ArmIdentity
  properties?: { principalId?: string; clientId?: string }
}

interface WorkloadLink {
  name: string
  type: string
  resourceId: string
  assignment: 'system' | 'user'
}

const GRAPH = 'https://graph.microsoft.com/v1.0'
const ARM = 'https://management.azure.com'

export function parseAzureConfig(raw: unknown): AzureConnectorConfig | null {
  if (!raw || typeof raw !== 'object') return null
  const c = raw as Record<string, unknown>
  const tenantId = String(c.tenantId ?? '').trim()
  const clientId = String(c.clientId ?? '').trim()
  const clientSecret = String(c.clientSecret ?? '').trim()
  if (!tenantId || !clientId || !clientSecret || clientSecret.includes('•')) return null
  const subscriptionId = String(c.subscriptionId ?? '').trim()
  return { tenantId, clientId, clientSecret, subscriptionId: subscriptionId || undefined }
}

export async function getAzureToken(config: AzureConnectorConfig, scope: string): Promise<string> {
  const res = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: 'client_credentials',
        scope,
      }),
    },
  )
  const text = await res.text()
  if (!res.ok) throw new Error(`Azure token failed (${res.status}): ${text.slice(0, 400)}`)
  const json = JSON.parse(text) as { access_token?: string }
  if (!json.access_token) throw new Error('Azure token response missing access_token')
  return json.access_token
}

/** Decode an Entra JWT payload without verifying the signature. Used only to report roles on 403. */
function graphTokenRoles(token: string): { appId?: string; roles: string[] } {
  try {
    const payload = token.split('.')[1]
    if (!payload) return { roles: [] }
    const json = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')) as {
      appid?: string
      azp?: string
      roles?: string[]
    }
    return { appId: json.appid ?? json.azp, roles: Array.isArray(json.roles) ? json.roles : [] }
  } catch {
    return { roles: [] }
  }
}

async function graphGetAll<T>(token: string, path: string): Promise<T[]> {
  const items: T[] = []
  let next: string | null = path.startsWith('http') ? path : `${GRAPH}${path}`
  while (next) {
    const res = await fetch(next, { headers: { Authorization: `Bearer ${token}` } })
    const text = await res.text()
    if (!res.ok) throw new Error(`Graph ${res.status} ${path.split('?')[0]}: ${text.slice(0, 400)}`)
    const body = JSON.parse(text) as { value?: T[]; '@odata.nextLink'?: string }
    items.push(...(body.value ?? []))
    next = body['@odata.nextLink'] ?? null
  }
  return items
}

async function graphGet<T>(token: string, path: string): Promise<T> {
  const res = await fetch(path.startsWith('http') ? path : `${GRAPH}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Graph ${res.status} ${path}: ${text.slice(0, 400)}`)
  return JSON.parse(text) as T
}

async function armGetAll<T>(token: string, url: string): Promise<T[]> {
  const items: T[] = []
  let next: string | null = url
  while (next) {
    const res = await fetch(next, { headers: { Authorization: `Bearer ${token}` } })
    const text = await res.text()
    if (!res.ok) throw new Error(`ARM ${res.status}: ${text.slice(0, 400)}`)
    const body = JSON.parse(text) as { value?: T[]; nextLink?: string }
    items.push(...(body.value ?? []))
    next = body.nextLink ?? null
  }
  return items
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let i = 0
  const workers = Array.from({ length: Math.min(limit, items.length || 1) }, async () => {
    while (i < items.length) {
      const idx = i++
      out[idx] = await fn(items[idx])
    }
  })
  await Promise.all(workers)
  return out
}

function inferEnvironment(tags?: string[], name?: string): string {
  const hay = `${(tags ?? []).join(' ')} ${name ?? ''}`.toLowerCase()
  if (/\b(prod|production|nhi-lab)\b/.test(hay)) return 'PROD'
  if (/\b(stag|staging)\b/.test(hay)) return 'STAGING'
  if (/\b(test|qa)\b/.test(hay)) return 'TEST'
  return 'DEV'
}

function daysBetween(iso?: string) {
  if (!iso) return undefined
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return undefined
  return Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24))
}

function yearsBetween(start?: string, end?: string) {
  if (!start || !end) return undefined
  const a = new Date(start).getTime()
  const b = new Date(end).getTime()
  if (Number.isNaN(a) || Number.isNaN(b)) return undefined
  return (b - a) / (1000 * 60 * 60 * 24 * 365)
}

function nearestExpiry(creds?: GraphCred[]) {
  const dates = (creds ?? []).map((c) => c.endDateTime).filter((d): d is string => Boolean(d)).sort()
  return dates[0]
}

function oldestStart(creds?: GraphCred[]) {
  const dates = (creds ?? []).map((c) => c.startDateTime).filter((d): d is string => Boolean(d)).sort()
  return dates[0]
}

function isCustomerWorkload(sp: GraphSP, appsByAppId: Map<string, GraphApp>) {
  if ((sp.servicePrincipalType ?? '').toLowerCase() === 'managedidentity') return true
  if ((sp.displayName ?? '').startsWith('NHI-LAB-')) return true
  if ((sp.displayName ?? '').startsWith('uami-nhi') || (sp.displayName ?? '').startsWith('vm-nhi')) return true
  if (sp.appId && appsByAppId.has(sp.appId)) return true
  return false
}

function scopeLabel(scope: string, subscriptionId?: string) {
  if (subscriptionId && scope.toLowerCase() === `/subscriptions/${subscriptionId}`.toLowerCase()) return 'Subscription'
  const rg = scope.match(/resourceGroups\/([^/]+)/i)
  if (rg && /\/resourceGroups\/[^/]+$/i.test(scope)) return `RG:${rg[1]}`
  const last = scope.split('/').filter(Boolean).slice(-2).join('/')
  return last || scope
}

function resourceKind(type?: string) {
  const t = (type ?? '').toLowerCase()
  if (t.includes('virtualmachines')) return 'VM'
  if (t.includes('sites') && t.includes('microsoft.web')) return 'App Service / Function'
  if (t.includes('keyvault')) return 'Key Vault'
  if (t.includes('storageaccounts')) return 'Storage'
  if (t.includes('managedidentity')) return 'UAMI'
  return type ?? 'resource'
}

export async function testAzureConnection(rawConfig: unknown): Promise<{
  connected: boolean
  latencyMs: number
  error?: string
  tenantName?: string
}> {
  const started = Date.now()
  const config = parseAzureConfig(rawConfig)
  if (!config) {
    return { connected: false, latencyMs: Date.now() - started, error: 'Missing tenant ID, client ID, or client secret' }
  }
  try {
    const token = await getAzureToken(config, 'https://graph.microsoft.com/.default')
    let tenantLabel = 'Azure'
    try {
      const org = await graphGet<{ value?: { displayName?: string }[] }>(token, '/organization?$select=id,displayName')
      tenantLabel = org.value?.[0]?.displayName ?? 'Azure'
    } catch {
      const apps = await graphGet<{ value?: unknown[] }>(token, '/applications?$top=1&$select=id')
      if (!Array.isArray(apps.value)) throw new Error('Graph reachable but returned an unexpected applications payload')
      tenantLabel = 'Azure (grant Organization.Read.All + admin consent for tenant name)'
    }
    let extra = ''
    if (config.subscriptionId) {
      try {
        const arm = await getAzureToken(config, 'https://management.azure.com/.default')
        const res = await fetch(`${ARM}/subscriptions/${config.subscriptionId}?api-version=2022-12-01`, {
          headers: { Authorization: `Bearer ${arm}` },
        })
        extra = res.ok ? ' · subscription readable' : ` · ARM ${res.status}`
      } catch {
        extra = ' · ARM token failed'
      }
    }
    return {
      connected: true,
      latencyMs: Date.now() - started,
      tenantName: `${tenantLabel}${extra}`,
    }
  } catch (err) {
    const raw = err instanceof Error ? err.message : 'Azure connection failed'
    const needsConsent = /403|Authorization_RequestDenied|Insufficient privileges/i.test(raw)
    if (!needsConsent) {
      return { connected: false, latencyMs: Date.now() - started, error: raw }
    }
    let consentHint =
      'Graph 403: permissions are listed but not in the token. On API permissions, Status must say Granted for your tenant (green check). Adding the permission is not enough — click Grant admin consent.'
    try {
      const token = await getAzureToken(config, 'https://graph.microsoft.com/.default')
      const { appId, roles } = graphTokenRoles(token)
      consentHint += ` Token app ${appId ?? config.clientId} has roles: ${roles.length ? roles.join(', ') : '(none)'}.`
    } catch {
      // keep the hint without token details
    }
    return { connected: false, latencyMs: Date.now() - started, error: consentHint }
  }
}

export async function discoverAzureNHIs(
  rawConfig: unknown,
  connectorId: string,
): Promise<{ nhis: AzureDiscoveredNHI[]; errors: string[]; findings: AzureFindingRecord[]; tenantName?: string }> {
  const config = parseAzureConfig(rawConfig)
  if (!config) {
    return { nhis: [], errors: ['Azure connector is missing tenant ID, client ID, or client secret'], findings: [] }
  }

  const errors: string[] = []
  const token = await getAzureToken(config, 'https://graph.microsoft.com/.default')

  let tenantName: string | undefined
  let tenantId = config.tenantId
  try {
    const org = await graphGet<{ value?: { displayName?: string; id?: string }[] }>(token, '/organization?$select=id,displayName')
    tenantName = org.value?.[0]?.displayName
    if (org.value?.[0]?.id) tenantId = org.value[0].id
  } catch (err) {
    errors.push(err instanceof Error ? err.message : 'Failed to read tenant')
  }

  const apps = await graphGetAll<GraphApp>(
    token,
    '/applications?$select=id,appId,displayName,createdDateTime,signInAudience,tags,passwordCredentials,keyCredentials&$expand=owners($select=id,displayName,userPrincipalName)&$top=999',
  )

  let sps: GraphSP[] = []
  try {
    sps = await graphGetAll<GraphSP>(
      token,
      '/servicePrincipals?$select=id,appId,displayName,servicePrincipalType,accountEnabled,createdDateTime,appOwnerOrganizationId,tags,passwordCredentials,keyCredentials,signInActivity&$expand=owners($select=id,displayName,userPrincipalName)&$top=999',
    )
  } catch {
    sps = await graphGetAll<GraphSP>(
      token,
      '/servicePrincipals?$select=id,appId,displayName,servicePrincipalType,accountEnabled,createdDateTime,appOwnerOrganizationId,tags,passwordCredentials,keyCredentials&$expand=owners($select=id,displayName,userPrincipalName)&$top=999',
    )
    errors.push('signInActivity not available; dormant detection uses name and accountEnabled only')
  }

  const roleBySp = new Map<string, string[]>()
  try {
    const roles = await graphGetAll<{ displayName?: string; members?: { id?: string }[] }>(
      token,
      '/directoryRoles?$expand=members($select=id)',
    )
    for (const role of roles) {
      for (const member of role.members ?? []) {
        if (!member.id) continue
        const list = roleBySp.get(member.id) ?? []
        list.push(role.displayName ?? 'Directory role')
        roleBySp.set(member.id, list)
      }
    }
  } catch (err) {
    errors.push(`Directory roles skipped: ${err instanceof Error ? err.message : 'unknown error'}`)
  }

  let ficByApp = new Map<string, FederatedCred[]>()
  try {
    const results = await mapPool(apps, 6, async (app) => {
      try {
        return { id: app.id, creds: await graphGetAll<FederatedCred>(token, `/applications/${app.id}/federatedIdentityCredentials`) }
      } catch {
        return { id: app.id, creds: [] as FederatedCred[] }
      }
    })
    ficByApp = new Map(results.map((r) => [r.id, r.creds]))
  } catch (err) {
    errors.push(`Federated credentials skipped: ${err instanceof Error ? err.message : 'unknown error'}`)
  }

  const rbacByPrincipal = new Map<string, { role: string; scope: string }[]>()
  const workloadsByPrincipal = new Map<string, WorkloadLink[]>()
  const uamiByPrincipal = new Map<string, { name: string; resourceId: string; attachments: string[] }>()

  if (config.subscriptionId) {
    try {
      const arm = await getAzureToken(config, 'https://management.azure.com/.default')
      const sub = config.subscriptionId

      const [assignments, definitions, vms, sites, uamis] = await Promise.all([
        armGetAll<ArmRoleAssignment>(arm, `${ARM}/subscriptions/${sub}/providers/Microsoft.Authorization/roleAssignments?api-version=2022-04-01`).catch((err) => {
          errors.push(`RBAC skipped: ${err instanceof Error ? err.message : 'unknown'}`)
          return [] as ArmRoleAssignment[]
        }),
        armGetAll<ArmRoleDefinition>(arm, `${ARM}/subscriptions/${sub}/providers/Microsoft.Authorization/roleDefinitions?api-version=2022-04-01`).catch(() => [] as ArmRoleDefinition[]),
        armGetAll<ArmResource>(arm, `${ARM}/subscriptions/${sub}/providers/Microsoft.Compute/virtualMachines?api-version=2023-09-01`).catch(() => [] as ArmResource[]),
        armGetAll<ArmResource>(arm, `${ARM}/subscriptions/${sub}/providers/Microsoft.Web/sites?api-version=2023-12-01`).catch(() => [] as ArmResource[]),
        armGetAll<ArmResource>(arm, `${ARM}/subscriptions/${sub}/providers/Microsoft.ManagedIdentity/userAssignedIdentities?api-version=2023-01-31`).catch(() => [] as ArmResource[]),
      ])

      const roleNameById = new Map(definitions.map((d) => [d.id ?? '', d.properties?.roleName ?? 'Unknown role']))

      for (const a of assignments) {
        const principalId = a.properties?.principalId
        const defId = a.properties?.roleDefinitionId
        const scope = a.properties?.scope ?? ''
        if (!principalId || !defId) continue
        const role = roleNameById.get(defId) ?? defId.split('/').pop() ?? 'Role'
        const list = rbacByPrincipal.get(principalId) ?? []
        list.push({ role, scope })
        rbacByPrincipal.set(principalId, list)
      }

      const attachIdentity = (resource: ArmResource, fallbackType: string) => {
        const identity = resource.identity
        if (!identity) return
        const type = resourceKind(resource.type) || fallbackType
        if (identity.principalId && /systemassigned/i.test(identity.type ?? '')) {
          const list = workloadsByPrincipal.get(identity.principalId) ?? []
          list.push({ name: resource.name ?? 'resource', type, resourceId: resource.id ?? '', assignment: 'system' })
          workloadsByPrincipal.set(identity.principalId, list)
        }
        for (const [id, meta] of Object.entries(identity.userAssignedIdentities ?? {})) {
          const pid = meta.principalId
          if (!pid) continue
          const list = workloadsByPrincipal.get(pid) ?? []
          list.push({ name: resource.name ?? 'resource', type, resourceId: resource.id ?? '', assignment: 'user' })
          workloadsByPrincipal.set(pid, list)
          const uami = uamiByPrincipal.get(pid)
          if (uami) uami.attachments.push(resource.name ?? id)
        }
      }

      for (const vm of vms) attachIdentity(vm, 'VM')
      for (const site of sites) attachIdentity(site, 'App Service / Function')

      for (const mi of uamis) {
        const principalId = mi.properties?.principalId
        if (!principalId) continue
        uamiByPrincipal.set(principalId, { name: mi.name ?? 'uami', resourceId: mi.id ?? '', attachments: [] })
        if (mi.id) {
          try {
            const res = await fetch(`${mi.id}/listAssociatedResources?api-version=2023-01-31`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${arm}` },
            })
            if (res.ok) {
              const body = await res.json() as { value?: { name?: string; id?: string }[] }
              const rec = uamiByPrincipal.get(principalId)
              if (rec) rec.attachments = [...new Set([...(rec.attachments), ...(body.value ?? []).map((v) => v.name || v.id || '')])]
            }
          } catch {
            // listAssociatedResources is best-effort; VM/site identity maps already cover lab attachments
          }
        }
      }
    } catch (err) {
      errors.push(`ARM correlation skipped: ${err instanceof Error ? err.message : 'unknown error'}`)
    }
  } else {
    errors.push('No subscription ID — RBAC, workloads, and UAMI correlation were skipped')
  }

  const appsByAppId = new Map(apps.filter((a) => a.appId).map((a) => [a.appId as string, a]))
  const seenAppIds = new Set<string>()
  const nhis: AzureDiscoveredNHI[] = []
  const findings: AzureFindingRecord[] = []

  const pushNhi = (input: {
    objectId: string
    idPrefix?: string
    displayName: string
    app?: GraphApp
    sp?: GraphSP
    fics: FederatedCred[]
    secrets: GraphCred[]
    certs: GraphCred[]
    owners: { id?: string; displayName?: string; userPrincipalName?: string }[]
    isManaged: boolean
    miKind?: 'system' | 'user' | ''
    extraTags?: Record<string, string>
  }) => {
    const principalId = input.sp?.id ?? input.objectId
    const rbac = rbacByPrincipal.get(principalId) ?? []
    const workloads = workloadsByPrincipal.get(principalId) ?? []
    const uami = uamiByPrincipal.get(principalId)
    const attachmentCount = Math.max(workloads.filter((w) => w.assignment === 'user').length, uami?.attachments.length ?? 0, input.miKind === 'system' ? workloads.length : 0)
    const miKind = input.miKind || (uami ? 'user' : (input.isManaged && workloads.some((w) => w.assignment === 'system') ? 'system' : input.isManaged ? 'user' : ''))
    const owner = input.owners.find((o) => o.displayName || o.userPrincipalName)
    const directoryRoles = roleBySp.get(principalId) ?? []
    const lastSignInDays = daysBetween(input.sp?.signInActivity?.lastSignInDateTime)
    const oldestSecretAgeDays = daysBetween(oldestStart(input.secrets))
    const secretYears = Math.max(0, ...(input.secrets.map((s) => yearsBetween(s.startDateTime, s.endDateTime) ?? 0)))

    const ctx: AzureRiskContext = {
      displayName: input.displayName,
      isManagedIdentity: input.isManaged,
      miKind,
      secretCount: input.secrets.length,
      certCount: input.certs.length,
      ficCount: input.fics.length,
      oldestSecretAgeDays,
      secretYears,
      hasOwner: Boolean(owner?.id),
      directoryRoles,
      rbacRoles: rbac.map((r) => r.role),
      rbacScopes: rbac.map((r) => r.scope),
      hasKeyVaultAccess: rbac.some((r) => /key vault/i.test(r.role)),
      hasStorageAccess: rbac.some((r) => /storage/i.test(r.role)),
      attachmentCount,
      workloadCount: workloads.length,
      ficIssuers: input.fics.map((f) => f.issuer ?? '').filter(Boolean),
      ficSubjects: input.fics.map((f) => f.subject ?? ''),
      disabled: input.sp?.accountEnabled === false,
      lastSignInDays,
      resourceCount: new Set(rbac.map((r) => r.scope)).size,
    }

    const evaluated = evaluateAzureRisk(ctx)
    const dormant = input.sp?.accountEnabled === false || /dormant/i.test(input.displayName) || (lastSignInDays != null && lastSignInDays > 60)

    let nhiType = 'SERVICE_ACCOUNT'
    let credentialType = 'OAUTH_CLIENT'
    if (input.isManaged) {
      nhiType = 'IAM_ROLE'
      credentialType = 'TOKEN'
    } else if (input.fics.length > 0) {
      nhiType = 'OIDC'
      credentialType = 'TOKEN'
    } else if (input.certs.length > 0 && input.secrets.length === 0) {
      nhiType = 'CERTIFICATE'
      credentialType = 'CERTIFICATE'
    }

    const nhiId = `${input.idPrefix ?? 'azure'}-${input.objectId}`
    nhis.push({
      nhiId,
      displayName: input.displayName,
      nhiType,
      credentialType,
      status: dormant ? 'DORMANT' : 'ACTIVE',
      ownerId: owner?.id,
      ownerTeam: owner?.displayName || owner?.userPrincipalName || (input.isManaged ? 'Azure Managed Identity' : undefined),
      environment: inferEnvironment([...(input.sp?.tags ?? []), ...(input.app?.tags ?? [])], input.displayName),
      privilegeLevel: evaluated.privilegeLevel,
      breadthScore: evaluated.breadthScore,
      isShared: attachmentCount > 1 || (input.app?.signInAudience ?? '').includes('Multiple'),
      isHardcoded: input.secrets.length > 0 && input.fics.length === 0 && !input.isManaged,
      vaultPath: input.isManaged ? 'azure/managed-identity' : input.fics.length ? 'entra/federated-identity' : undefined,
      rotationSchedule: input.secrets.length > 0 ? 'manual-secret' : undefined,
      certExpiry: nearestExpiry(input.certs) || nearestExpiry(input.secrets),
      createdAt: input.sp?.createdDateTime || input.app?.createdDateTime || new Date().toISOString(),
      sourceConnector: connectorId,
      riskScore: evaluated.score,
      riskLevel: evaluated.level,
      tags: {
        platform: 'azure',
        tenant: tenantId,
        tenant_name: tenantName ?? '',
        object_id: input.objectId,
        app_id: input.sp?.appId ?? input.app?.appId ?? '',
        sp_type: input.isManaged
          ? (miKind === 'system' ? 'SystemAssignedManagedIdentity' : 'UserAssignedManagedIdentity')
          : (input.sp?.servicePrincipalType ?? 'Application'),
        first_party: input.sp?.appOwnerOrganizationId && input.sp.appOwnerOrganizationId !== tenantId ? 'true' : 'false',
        secret_count: String(input.secrets.length),
        cert_count: String(input.certs.length),
        fic_count: String(input.fics.length),
        fic_issuers: input.fics.map((f) => f.issuer).filter(Boolean).join(' | '),
        fic_subjects: input.fics.map((f) => f.subject).filter(Boolean).join(' | '),
        fic_audiences: input.fics.flatMap((f) => f.audiences ?? []).join(' | '),
        directory_roles: directoryRoles.join(' | '),
        rbac_roles: rbac.map((r) => r.role).join(' | '),
        rbac: rbac.map((r) => `${r.role}@${scopeLabel(r.scope, config.subscriptionId)}`).join(' | '),
        kv_access: ctx.hasKeyVaultAccess ? 'yes' : 'no',
        storage_access: ctx.hasStorageAccess ? 'yes' : 'no',
        workloads: workloads.map((w) => `${w.name} (${w.type}/${w.assignment})`).join(' | '),
        attachment_count: String(attachmentCount),
        mi_kind: miKind,
        last_sign_in_days: lastSignInDays != null ? String(lastSignInDays) : '',
        secret_age_days: oldestSecretAgeDays != null ? String(oldestSecretAgeDays) : '',
        findings: evaluated.findings.map((f) => f.ruleId).join(','),
        risk_reasons: evaluated.reasons.join(' | '),
        subscription_id: config.subscriptionId ?? '',
        ...input.extraTags,
      },
    })

    for (const f of evaluated.findings) {
      if (f.posture === 'GOOD') continue
      findings.push({
        issueId: `${f.ruleId}:${nhiId}`.slice(0, 80),
        nhiId,
        nhiName: input.displayName,
        issueType: f.issueType,
        severity: f.severity,
        message: f.message,
        ruleId: f.ruleId,
      })
    }
  }

  for (const sp of sps) {
    const app = sp.appId ? appsByAppId.get(sp.appId) : undefined
    if (!isCustomerWorkload(sp, appsByAppId)) continue
    if (sp.appId) seenAppIds.add(sp.appId)
    const isManaged = (sp.servicePrincipalType ?? '').toLowerCase() === 'managedidentity'
    pushNhi({
      objectId: sp.id,
      displayName: sp.displayName || app?.displayName || sp.appId || sp.id,
      app,
      sp,
      fics: app ? (ficByApp.get(app.id) ?? []) : [],
      secrets: [...(app?.passwordCredentials ?? []), ...(sp.passwordCredentials ?? [])],
      certs: [...(app?.keyCredentials ?? []), ...(sp.keyCredentials ?? [])],
      owners: [...(app?.owners ?? []), ...(sp.owners ?? [])],
      isManaged,
    })
  }

  for (const app of apps) {
    if (app.appId && seenAppIds.has(app.appId)) continue
    pushNhi({
      objectId: app.id,
      idPrefix: 'azure-app',
      displayName: app.displayName || app.appId || app.id,
      app,
      fics: ficByApp.get(app.id) ?? [],
      secrets: app.passwordCredentials ?? [],
      certs: app.keyCredentials ?? [],
      owners: app.owners ?? [],
      isManaged: false,
      extraTags: { note: 'No enterprise application in this tenant' },
    })
  }

  return { nhis, errors, findings, tenantName }
}
