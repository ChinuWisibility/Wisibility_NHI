export type NHIType =
  | 'SERVICE_ACCOUNT'
  | 'API_KEY'
  | 'WEBHOOK_SECRET'
  | 'LONG_LIVED_TOKEN'
  | 'CERTIFICATE'
  | 'RPA_BOT'
  | 'IAM_ROLE'
  | 'OIDC'
  | 'SPIFFE_SVID'

export type CredentialType =
  | 'PASSWORD'
  | 'API_KEY'
  | 'TOKEN'
  | 'CERTIFICATE'
  | 'OAUTH_CLIENT'
  | 'SSH_KEY'

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export type NHIStatus = 'ACTIVE' | 'DORMANT' | 'DECOMMISSIONED' | 'PENDING' | 'ARCHIVED'

export type LifecycleStage =
  | 'PROVISIONING'
  | 'DISCOVERY'
  | 'CLASSIFICATION'
  | 'HYGIENE'
  | 'SECURING'
  | 'MONITORING'
  | 'PREVENT'

export type Environment = 'PROD' | 'STAGING' | 'DEV' | 'TEST'

export type PrivilegeLevel = 'ADMIN' | 'ELEVATED' | 'STANDARD' | 'READ_ONLY'

export interface NHI {
  nhiId: string
  displayName: string
  nhiType: NHIType
  credentialType: CredentialType
  status: NHIStatus
  riskScore: number
  riskLevel: RiskLevel
  ownerId?: string
  ownerTeam?: string
  environment: Environment
  privilegeLevel: PrivilegeLevel
  breadthScore: number
  isShared: boolean
  isHardcoded: boolean
  vaultPath?: string
  rotationSchedule?: string
  certExpiry?: string
  lastDiscovered: string
  createdAt: string
  updatedAt: string
  sourceConnector: string
  tags: Record<string, string>
}

export interface NHIRiskBreakdown {
  privilege:  number
  breadth:    number
  age:        number
  exposure:   number
  usage:      number
  total:      number
}

export interface NHIListParams {
  page?:       number
  limit?:      number
  q?:          string
  riskLevel?:  RiskLevel
  environment?: Environment
  nhiType?:    NHIType
  status?:     NHIStatus
  ownerId?:    string
  sourceConnector?: string
}
