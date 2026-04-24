export type AlertSeverity = 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4'

export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED'

export type AnomalyType =
  | 'TIME_OF_DAY'
  | 'VOLUME_SPIKE'
  | 'CROSS_ENV'
  | 'CRED_SHARING'
  | 'LATERAL_MOVEMENT'
  | 'PRIV_ESCALATION'
  | 'STALE_ACTIVE'
  | 'GEO_ANOMALY'

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

export interface AlertTimelineEvent {
  timestamp: string
  actor:     string
  action:    string
  detail?:   string
}
