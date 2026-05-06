export type PostureIssueCategory =
  | 'EXCESS_PERMISSIONS'
  | 'STALE_ACCOUNT'
  | 'SHARED_ACCOUNT'
  | 'ENV_NOT_SEGREGATED'
  | 'PLAINTEXT_FOUND'
  | 'NO_OWNER'

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
  delta:       number
  open:        number
  acknowledged: number
  trend:       { date: string; score: number }[]
  byCategory:  { category: string; count: number }[]
  discovery: {
    connectorsCount: number
    totalAccounts:   number
    byConnector:     { id: string; count: number }[]
  }
  classification: {
    ownership: { assigned: number; unassigned: number }
    privilege: { admin: number; elevated: number; standard: number; readonly: number }
    breadth:   { high: number; medium: number; low: number }
    usage:     { active: number; dormant: number; pending: number }
  }
  hygiene: {
    excessivePermissions: number
    inactiveAccounts:     number
    sharedAccounts:       number
    envSegregation:      { prod: number; nonProd: number }
  }
}
