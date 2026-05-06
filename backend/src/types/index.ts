// ── NHI Core ──────────────────────────────────────────────────────────────────
export type NHIType =
  | 'SERVICE_ACCOUNT' | 'API_KEY' | 'WEBHOOK_SECRET' | 'LONG_LIVED_TOKEN'
  | 'CERTIFICATE' | 'RPA_BOT' | 'IAM_ROLE' | 'OIDC' | 'SPIFFE_SVID'

export type CredentialType =
  | 'PASSWORD' | 'API_KEY' | 'TOKEN' | 'CERTIFICATE' | 'OAUTH_CLIENT' | 'SSH_KEY'

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export type NHIStatus = 'ACTIVE' | 'DORMANT' | 'DECOMMISSIONED' | 'PENDING' | 'ARCHIVED'

export type LifecycleStage =
  | 'PROVISIONING' | 'DISCOVERY' | 'CLASSIFICATION' | 'HYGIENE'
  | 'SECURING' | 'MONITORING' | 'PREVENT'

export type Environment = 'PROD' | 'STAGING' | 'DEV' | 'TEST'

export type PrivilegeLevel = 'ADMIN' | 'ELEVATED' | 'STANDARD' | 'READ_ONLY'

export interface NHI {
  nhiId:             string
  displayName:       string
  nhiType:           NHIType
  credentialType:    CredentialType
  status:            NHIStatus
  riskScore:         number
  riskLevel:         RiskLevel
  ownerId?:          string
  ownerTeam?:        string
  environment:       Environment
  privilegeLevel:    PrivilegeLevel
  breadthScore:      number
  isShared:          boolean
  isHardcoded:       boolean
  vaultPath?:        string
  rotationSchedule?: string
  certExpiry?:       string
  lastDiscovered:    string
  createdAt:         string
  updatedAt:         string
  sourceConnector:   string
  tags:              Record<string, string>
}

// ── Posture ───────────────────────────────────────────────────────────────────
export type PostureIssueCategory =
  | 'EXCESS_PERMISSIONS' | 'STALE_ACCOUNT' | 'SHARED_ACCOUNT'
  | 'ENV_NOT_SEGREGATED' | 'PLAINTEXT_FOUND' | 'NO_OWNER'

export type PostureIssueSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export type RemediationStatus = 'OPEN' | 'ACKNOWLEDGED' | 'REMEDIATED'

export interface PostureIssue {
  issueId:       string
  nhiId:         string
  nhiName?:      string
  issueType:     PostureIssueCategory
  severity:      PostureIssueSeverity
  status:        RemediationStatus
  detectedAt:    string
  remediatedAt?: string
  remediatedBy?: string
  details:       Record<string, unknown>
}

export interface PostureReport {
  score:       number
  scoreDelta:  number
  issueCount:  Record<PostureIssueCategory, number>
  trend:       { date: string; score: number }[]
  generatedAt: string
}

// ── Alerts ────────────────────────────────────────────────────────────────────
export type AlertSeverity = 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4'
export type AlertStatus   = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED'
export type AnomalyType   =
  | 'TIME_OF_DAY' | 'VOLUME_SPIKE' | 'CROSS_ENV' | 'CRED_SHARING'
  | 'LATERAL_MOVEMENT' | 'PRIV_ESCALATION' | 'STALE_ACTIVE' | 'GEO_ANOMALY'

export interface AlertTimelineEvent {
  timestamp: string
  actor:     string
  action:    string
  detail?:   string
}

export interface Alert {
  alertId:       string
  nhiId:         string
  nhiName?:      string
  alertType:     AnomalyType
  severity:      AlertSeverity
  description:   string
  status:        AlertStatus
  detectedAt:    string
  resolvedAt?:   string
  assignedTo?:   string
  itsmTicketId?: string
  forensicData?: Record<string, unknown>
  timeline:      AlertTimelineEvent[]
}

// ── Connectors ────────────────────────────────────────────────────────────────
export type ConnectorType =
  | 'AD' | 'CLOUD_AWS' | 'CLOUD_AZURE' | 'CLOUD_GCP'
  | 'VAULT_HASHICORP' | 'VAULT_CYBERARK' | 'VAULT_AWS_SM'
  | 'GITHUB' | 'GITLAB' | 'KUBERNETES' | 'DATABASE'
  | 'CICD_JENKINS' | 'CICD_AZURE_DEVOPS' | 'SAAS' | 'DEMO'

export type ConnectorStatus = 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'TESTING' | 'PENDING'

export interface ConnectorConfig {
  connectorId:   string
  connectorType: ConnectorType
  displayName:   string
  status:        ConnectorStatus
  config:        Record<string, string>
  lastTestAt?:   string
  lastRunAt?:    string
  createdAt:     string
}

export interface DiscoveryRun {
  runId:          string
  connectorType:  ConnectorType
  startedAt:      string
  completedAt?:   string
  status:         'RUNNING' | 'COMPLETED' | 'FAILED'
  nhisDiscovered: number
  nhisNew:        number
  nhisUpdated:    number
  nhisRemoved:    number
  errors:         string[]
  triggeredBy:    string
}

// ── Compliance ────────────────────────────────────────────────────────────────
export type RegulatoryFramework = 'SOX' | 'PCI_DSS' | 'DORA' | 'ISO_27001' | 'SOC2'
export type ComplianceStatus    = 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT'
export type CertificationDecision = 'CERTIFY' | 'REVOKE' | 'FLAG'
export type CampaignStatus      = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED'

export interface ComplianceScore {
  framework: RegulatoryFramework
  score:     number
  controls:  number
  passing:   number
  failing:   number
}

export interface CertificationCampaign {
  campaignId: string
  name:       string
  framework:  RegulatoryFramework
  status:     CampaignStatus
  nhiScope:   string[]
  certifiers: string[]
  dueDate:    string
  createdAt:  string
  closedAt?:  string
  decisions:  number
  pending:    number
}

export interface CertificationDecisionRecord {
  campaignId:    string
  nhiId:         string
  certifierId:   string
  decision:      CertificationDecision
  justification: string
  decidedAt:     string
}

// ── Audit ─────────────────────────────────────────────────────────────────────
export interface AuditLogEntry {
  eventId:      string
  resourceId:   string
  resourceType: string
  actorId:      string
  actorRole:    string
  action:       string
  before?:      Record<string, unknown>
  after?:       Record<string, unknown>
  ipAddress:    string
  timestamp:    string
  traceId:      string
}

// ── User ──────────────────────────────────────────────────────────────────────
export type UserRole = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5'

export interface User {
  userId:     string
  email:      string
  name:       string
  role:       UserRole
  mfaEnabled: boolean
  createdAt:  string
}

// ── Policies ──────────────────────────────────────────────────────────────────
export type PolicyAction =
  | 'REQUIRE_ROTATION'
  | 'ENFORCE_VAULT'
  | 'ALERT'
  | 'REQUIRE_REVIEW'
  | 'BLOCK_DEPLOYMENT'
  | 'REQUIRE_MFA'

export interface PolicyFilters {
  nhiType?:     NHIType[]
  riskLevel?:   RiskLevel[]
  environment?: Environment[]
  ownerTeam?:   string[]
}

export interface Policy {
  policyId:      string
  name:          string
  description:   string
  enabled:       boolean
  filters:       PolicyFilters
  action:        PolicyAction
  affectedCount: number        // computed server-side
  createdAt:     string
  updatedAt:     string
  createdBy:     string
}

// ── API wrappers ──────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data:     T
  message?: string
}

export interface PaginatedResponse<T> {
  items:      T[]
  total:      number
  page:       number
  limit:      number
  totalPages: number
}
