import type {
  NHI, PostureIssue, Alert, ConnectorConfig,
  DiscoveryRun, ComplianceScore, CertificationCampaign,
  AuditLogEntry, CertificationDecisionRecord, Policy, User,
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
  Policies as seedPolicies,
  Users as seedUsers,
} from './seed.js'
import { generateDemoNHIs } from '../services/demo-generator.js'

export const db = {
  nhis:                 [...seedNHIs, ...generateDemoNHIs(1200)] as NHI[],
  postureIssues:        [...seedPostureIssues] as PostureIssue[],
  alerts:               [...seedAlerts] as Alert[],
  connectors:           [...seedConnectors] as ConnectorConfig[],
  discoveryRuns:        [...seedDiscoveryRuns] as DiscoveryRun[],
  complianceScores:     [...seedComplianceScores] as ComplianceScore[],
  certCampaigns:        [...seedCampaigns] as CertificationCampaign[],
  certDecisions:        [] as CertificationDecisionRecord[],
  auditLogs:            [...seedAuditLogs] as AuditLogEntry[],
  policies:             seedPolicies.map((p) => ({ ...p, affectedCount: 0 })) as Policy[],
  users:                [...seedUsers] as User[],
}
