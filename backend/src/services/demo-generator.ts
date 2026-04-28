import { v4 as uuid } from 'uuid'
import type { NHI, NHIType, CredentialType, Environment, PrivilegeLevel, NHIStatus } from '../types/index.js'
import { computeRiskScore } from './risk-scorer.js'

const NHI_TYPES:         NHIType[]       = ['SERVICE_ACCOUNT','API_KEY','LONG_LIVED_TOKEN','CERTIFICATE','IAM_ROLE','WEBHOOK_SECRET','RPA_BOT','OIDC','SPIFFE_SVID']
const CRED_TYPES:        CredentialType[] = ['PASSWORD','API_KEY','TOKEN','CERTIFICATE','OAUTH_CLIENT','SSH_KEY']
const ENVS:              Environment[]    = ['PROD','PROD','PROD','STAGING','STAGING','DEV','TEST']
const PRIVILEGE_LEVELS:  PrivilegeLevel[] = ['ADMIN','ELEVATED','ELEVATED','STANDARD','STANDARD','STANDARD','READ_ONLY','READ_ONLY']
const STATUSES:          NHIStatus[]      = ['ACTIVE','ACTIVE','ACTIVE','ACTIVE','DORMANT','PENDING']

const TEAMS  = ['Payments','Platform','Security','Data','DevOps','ML Platform','CRM','Finance','Notifications','Cloud','QA','Automation','Frontend','Compliance','Analytics']
const APPS   = ['payments-svc','gateway-svc','auth-svc','analytics-svc','reporting-svc','ml-trainer','crm-bridge','data-pipeline','notification-svc','backup-agent','monitoring-svc','audit-logger','identity-svc','vault-operator','cert-manager','scheduler','file-processor','event-bus','api-proxy','sync-worker','health-checker','rate-limiter','cache-warmer','db-migrator','etl-runner']
const CONNECTORS = ['conn-ad-01','conn-azure-01','conn-aws-01','conn-gcp-01','conn-k8s-01','conn-github-01','conn-vault-01','conn-demo-01']
const VENDORS = ['stripe','salesforce','datadog','pagerduty','jira','confluence','slack','github','gitlab','aws','azure','gcp','okta','splunk','crowdstrike','snyk','sonarqube','artifactory','nexus','jenkins']

const SUFFIX_BY_TYPE: Record<NHIType, string[]> = {
  SERVICE_ACCOUNT:  ['-svc','=sa','-agent','-worker','-operator','-daemon'],
  API_KEY:          ['-api-key','-token','-apikey','-access-key'],
  LONG_LIVED_TOKEN: ['-lt','-pat','-session-token'],
  CERTIFICATE:      ['-cert','-tls','-ssl','-mtls'],
  IAM_ROLE:         ['-role','-iam','-assume-role'],
  WEBHOOK_SECRET:   ['-webhook','-hook-secret','-secret'],
  RPA_BOT:          ['-bot','-rpa','-automator'],
  OIDC:             ['-oidc','-client','-app'],
  SPIFFE_SVID:      ['-svid','-spiffe','-workload-id'],
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export function generateDemoNHIs(count = 1000): NHI[] {
  const now = new Date().toISOString()
  const nhis: NHI[] = []

  for (let i = 0; i < count; i++) {
    const nhiType        = pick(NHI_TYPES,        i * 7)
    const credentialType = pick(CRED_TYPES,        i * 3)
    const environment    = pick(ENVS,              i * 5)
    const privilegeLevel = pick(PRIVILEGE_LEVELS,  i * 11)
    const status         = pick(STATUSES,          i * 13)
    const team           = pick(TEAMS,             i * 17)
    const app            = pick(APPS,              i * 19)
    const connector      = pick(CONNECTORS,        i * 23)
    const suffix         = pick(SUFFIX_BY_TYPE[nhiType], i * 29)
    const envSuffix      = environment === 'PROD' ? '' : `-${environment.toLowerCase()}`

    const displayName = `${app}${suffix}${envSuffix}${i > 300 ? `-${i}` : ''}`

    const ageDays    = (i % 700) + 10
    const breadth    = Math.min(100, (i % 90) + 5)
    const isShared   = i % 7 === 0
    const isHardcoded = i % 9 === 0
    const ownerId    = i % 5 === 0 ? undefined : `owner-team-${team.toLowerCase().replace(/\s/g, '-')}`
    const vaultPath  = isHardcoded ? undefined : `vault/${nhiType.toLowerCase()}/${app}`

    const certExpiry =
      nhiType === 'CERTIFICATE'
        ? daysAgo(-(Math.floor(Math.random() * 300) + 10))
        : undefined

    const { score, level } = computeRiskScore({
      privilegeLevel,
      breadthScore: breadth,
      createdAt:    daysAgo(ageDays),
      isHardcoded,
      isShared,
      ownerId,
      certExpiry,
      vaultPath,
    })

    const vendor = nhiType === 'WEBHOOK_SECRET' || nhiType === 'API_KEY'
      ? pick(VENDORS, i * 31)
      : undefined

    nhis.push({
      nhiId:          `demo-nhi-${String(i + 1).padStart(5, '0')}`,
      displayName,
      nhiType,
      credentialType,
      status,
      riskScore:      score,
      riskLevel:      level,
      ownerId,
      ownerTeam:      team,
      environment,
      privilegeLevel,
      breadthScore:   breadth,
      isShared,
      isHardcoded,
      vaultPath,
      rotationSchedule: isHardcoded ? undefined : pick(['30d','60d','90d','180d','365d'], i),
      certExpiry,
      lastDiscovered: daysAgo(i % 30),
      createdAt:      daysAgo(ageDays),
      updatedAt:      daysAgo(i % 14),
      sourceConnector: connector,
      tags: {
        app,
        team: team.toLowerCase().replace(/\s/g, '-'),
        env:  environment.toLowerCase(),
        ...(vendor ? { vendor } : {}),
        demo: 'true',
      },
    })
  }

  return nhis
}
