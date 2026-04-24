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
  scoreDelta:  number
  issueCount:  Record<PostureIssueCategory, number>
  trend:       { date: string; score: number }[]
  generatedAt: string
}
