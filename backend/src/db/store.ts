import type {
  NHI, PostureIssue, Alert, ConnectorConfig,
  DiscoveryRun, ComplianceScore, CertificationCampaign,
  AuditLogEntry, CertificationDecisionRecord,
} from '../types/index.js'
import {
  NHIs as seedNHIs,
  PostureIssues as seedPostureIssues,
  Alerts as seedAlerts,
  Connectors as seedConnectors,
  DiscoveryRuns as seedDiscoveryRuns,
  ComplianceScores as seedComplianceScores,
  CertificationCampaigns as seedCampaigns,
  AuditLogs as seedAuditLogs,
} from './seed.js'

export const db = {
  nhis:                 [...seedNHIs] as NHI[],
  postureIssues:        [...seedPostureIssues] as PostureIssue[],
  alerts:               [...seedAlerts] as Alert[],
  connectors:           [...seedConnectors] as ConnectorConfig[],
  discoveryRuns:        [...seedDiscoveryRuns] as DiscoveryRun[],
  complianceScores:     [...seedComplianceScores] as ComplianceScore[],
  certCampaigns:        [...seedCampaigns] as CertificationCampaign[],
  certDecisions:        [] as CertificationDecisionRecord[],
  auditLogs:            [...seedAuditLogs] as AuditLogEntry[],
}
