import { v4 as uuid } from 'uuid'
import type {
  NHI, PostureIssue, Alert, ConnectorConfig,
  DiscoveryRun, ComplianceScore, CertificationCampaign,
  AuditLogEntry,
} from '../types/index.js'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function hoursAgo(n: number): string {
  const d = new Date()
  d.setHours(d.getHours() - n)
  return d.toISOString()
}

// ── NHIs ─────────────────────────────────────────────────────────────────────
export const NHIs: NHI[] = [
  {
    nhiId: 'nhi-001', displayName: 'prod-payments-svc', nhiType: 'SERVICE_ACCOUNT',
    credentialType: 'PASSWORD', status: 'ACTIVE', riskScore: 91, riskLevel: 'CRITICAL',
    ownerId: 'dev-L2', ownerTeam: 'Payments', environment: 'PROD',
    privilegeLevel: 'ADMIN', breadthScore: 85, isShared: true, isHardcoded: true,
    vaultPath: undefined, rotationSchedule: undefined,
    lastDiscovered: daysAgo(1), createdAt: daysAgo(400), updatedAt: daysAgo(1),
    sourceConnector: 'conn-ad-01', tags: { app: 'payments', tier: 'critical' },
  },
  {
    nhiId: 'nhi-002', displayName: 'github-actions-token', nhiType: 'LONG_LIVED_TOKEN',
    credentialType: 'TOKEN', status: 'ACTIVE', riskScore: 78, riskLevel: 'HIGH',
    ownerId: 'dev-L3', ownerTeam: 'Platform', environment: 'PROD',
    privilegeLevel: 'ELEVATED', breadthScore: 70, isShared: false, isHardcoded: true,
    vaultPath: undefined, rotationSchedule: undefined,
    lastDiscovered: daysAgo(2), createdAt: daysAgo(200), updatedAt: daysAgo(2),
    sourceConnector: 'conn-github-01', tags: { repo: 'nhi-alps', env: 'prod' },
  },
  {
    nhiId: 'nhi-003', displayName: 'k8s-default-sa', nhiType: 'SERVICE_ACCOUNT',
    credentialType: 'TOKEN', status: 'ACTIVE', riskScore: 62, riskLevel: 'HIGH',
    ownerId: undefined, ownerTeam: 'Platform', environment: 'PROD',
    privilegeLevel: 'ELEVATED', breadthScore: 60, isShared: true, isHardcoded: false,
    vaultPath: 'vault/k8s/default-sa', rotationSchedule: '90d',
    lastDiscovered: daysAgo(1), createdAt: daysAgo(180), updatedAt: daysAgo(1),
    sourceConnector: 'conn-k8s-01', tags: { namespace: 'default' },
  },
  {
    nhiId: 'nhi-004', displayName: 'azure-devops-sp', nhiType: 'IAM_ROLE',
    credentialType: 'OAUTH_CLIENT', status: 'ACTIVE', riskScore: 55, riskLevel: 'MEDIUM',
    ownerId: 'dev-L1', ownerTeam: 'DevOps', environment: 'STAGING',
    privilegeLevel: 'ELEVATED', breadthScore: 50, isShared: false, isHardcoded: false,
    vaultPath: 'vault/azure/devops-sp', rotationSchedule: '30d',
    lastDiscovered: daysAgo(3), createdAt: daysAgo(150), updatedAt: daysAgo(3),
    sourceConnector: 'conn-azure-01', tags: { project: 'nhi-alps' },
  },
  {
    nhiId: 'nhi-005', displayName: 'rds-backup-agent', nhiType: 'SERVICE_ACCOUNT',
    credentialType: 'PASSWORD', status: 'DORMANT', riskScore: 48, riskLevel: 'MEDIUM',
    ownerId: 'dev-L3', ownerTeam: 'Data', environment: 'PROD',
    privilegeLevel: 'STANDARD', breadthScore: 30, isShared: false, isHardcoded: false,
    vaultPath: 'vault/db/rds-backup', rotationSchedule: '60d',
    lastDiscovered: daysAgo(90), createdAt: daysAgo(360), updatedAt: daysAgo(90),
    sourceConnector: 'conn-azure-01', tags: { db: 'postgres', tier: 'backup' },
  },
  {
    nhiId: 'nhi-006', displayName: 'stripe-webhook-secret', nhiType: 'WEBHOOK_SECRET',
    credentialType: 'API_KEY', status: 'ACTIVE', riskScore: 70, riskLevel: 'HIGH',
    ownerId: 'dev-L2', ownerTeam: 'Payments', environment: 'PROD',
    privilegeLevel: 'STANDARD', breadthScore: 40, isShared: false, isHardcoded: true,
    vaultPath: undefined, rotationSchedule: undefined,
    lastDiscovered: daysAgo(1), createdAt: daysAgo(280), updatedAt: daysAgo(1),
    sourceConnector: 'conn-saas-01', tags: { vendor: 'stripe' },
  },
  {
    nhiId: 'nhi-007', displayName: 'hashicorp-vault-root', nhiType: 'SERVICE_ACCOUNT',
    credentialType: 'TOKEN', status: 'ACTIVE', riskScore: 95, riskLevel: 'CRITICAL',
    ownerId: undefined, ownerTeam: 'Security', environment: 'PROD',
    privilegeLevel: 'ADMIN', breadthScore: 95, isShared: false, isHardcoded: false,
    vaultPath: undefined, rotationSchedule: undefined,
    lastDiscovered: daysAgo(1), createdAt: daysAgo(500), updatedAt: daysAgo(1),
    sourceConnector: 'conn-vault-01', tags: { tier: 'critical', managed_by: 'security' },
  },
  {
    nhiId: 'nhi-008', displayName: 'monitoring-grafana-api', nhiType: 'API_KEY',
    credentialType: 'API_KEY', status: 'ACTIVE', riskScore: 35, riskLevel: 'LOW',
    ownerId: 'dev-L3', ownerTeam: 'Platform', environment: 'STAGING',
    privilegeLevel: 'READ_ONLY', breadthScore: 20, isShared: false, isHardcoded: false,
    vaultPath: 'vault/monitoring/grafana', rotationSchedule: '90d',
    lastDiscovered: daysAgo(2), createdAt: daysAgo(100), updatedAt: daysAgo(2),
    sourceConnector: 'conn-saas-01', tags: { tool: 'grafana' },
  },
  {
    nhiId: 'nhi-009', displayName: 'ci-docker-registry-cred', nhiType: 'SERVICE_ACCOUNT',
    credentialType: 'PASSWORD', status: 'ACTIVE', riskScore: 52, riskLevel: 'MEDIUM',
    ownerId: 'dev-L3', ownerTeam: 'DevOps', environment: 'DEV',
    privilegeLevel: 'STANDARD', breadthScore: 45, isShared: true, isHardcoded: false,
    vaultPath: 'vault/ci/docker-registry', rotationSchedule: '30d',
    lastDiscovered: daysAgo(4), createdAt: daysAgo(120), updatedAt: daysAgo(4),
    sourceConnector: 'conn-k8s-01', tags: { registry: 'acr', team: 'devops' },
  },
  {
    nhiId: 'nhi-010', displayName: 'ml-training-bot', nhiType: 'RPA_BOT',
    credentialType: 'OAUTH_CLIENT', status: 'ACTIVE', riskScore: 40, riskLevel: 'MEDIUM',
    ownerId: 'dev-L3', ownerTeam: 'ML Platform', environment: 'DEV',
    privilegeLevel: 'STANDARD', breadthScore: 35, isShared: false, isHardcoded: false,
    vaultPath: 'vault/ml/training-bot', rotationSchedule: '60d',
    lastDiscovered: daysAgo(5), createdAt: daysAgo(80), updatedAt: daysAgo(5),
    sourceConnector: 'conn-azure-01', tags: { team: 'ml', workload: 'training' },
  },
  {
    nhiId: 'nhi-011', displayName: 'prod-api-gateway-key', nhiType: 'API_KEY',
    credentialType: 'API_KEY', status: 'ACTIVE', riskScore: 84, riskLevel: 'CRITICAL',
    ownerId: undefined, ownerTeam: undefined, environment: 'PROD',
    privilegeLevel: 'ELEVATED', breadthScore: 80, isShared: true, isHardcoded: true,
    vaultPath: undefined, rotationSchedule: undefined,
    lastDiscovered: daysAgo(1), createdAt: daysAgo(600), updatedAt: daysAgo(1),
    sourceConnector: 'conn-azure-01', tags: { service: 'api-gateway' },
  },
  {
    nhiId: 'nhi-012', displayName: 'salesforce-integration-sa', nhiType: 'SERVICE_ACCOUNT',
    credentialType: 'OAUTH_CLIENT', status: 'ACTIVE', riskScore: 45, riskLevel: 'MEDIUM',
    ownerId: 'dev-L2', ownerTeam: 'CRM', environment: 'PROD',
    privilegeLevel: 'STANDARD', breadthScore: 30, isShared: false, isHardcoded: false,
    vaultPath: 'vault/saas/salesforce', rotationSchedule: '90d',
    lastDiscovered: daysAgo(3), createdAt: daysAgo(220), updatedAt: daysAgo(3),
    sourceConnector: 'conn-saas-01', tags: { vendor: 'salesforce', team: 'crm' },
  },
  {
    nhiId: 'nhi-013', displayName: 'cert-ingress-wildcard', nhiType: 'CERTIFICATE',
    credentialType: 'CERTIFICATE', status: 'ACTIVE', riskScore: 66, riskLevel: 'HIGH',
    certExpiry: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    ownerId: 'dev-L3', ownerTeam: 'Platform', environment: 'PROD',
    privilegeLevel: 'STANDARD', breadthScore: 55, isShared: false, isHardcoded: false,
    vaultPath: 'vault/certs/ingress-wildcard', rotationSchedule: '365d',
    lastDiscovered: daysAgo(1), createdAt: daysAgo(353), updatedAt: daysAgo(1),
    sourceConnector: 'conn-k8s-01', tags: { domain: '*.nhi-alps.io' },
  },
  {
    nhiId: 'nhi-014', displayName: 'legacy-ftp-service', nhiType: 'SERVICE_ACCOUNT',
    credentialType: 'PASSWORD', status: 'DORMANT', riskScore: 38, riskLevel: 'LOW',
    ownerId: undefined, ownerTeam: 'Data', environment: 'STAGING',
    privilegeLevel: 'STANDARD', breadthScore: 10, isShared: false, isHardcoded: false,
    vaultPath: undefined, rotationSchedule: undefined,
    lastDiscovered: daysAgo(120), createdAt: daysAgo(700), updatedAt: daysAgo(120),
    sourceConnector: 'conn-ad-01', tags: { legacy: 'true' },
  },
  {
    nhiId: 'nhi-015', displayName: 'oidc-frontend-app', nhiType: 'OIDC',
    credentialType: 'OAUTH_CLIENT', status: 'ACTIVE', riskScore: 28, riskLevel: 'LOW',
    ownerId: 'dev-L3', ownerTeam: 'Frontend', environment: 'PROD',
    privilegeLevel: 'READ_ONLY', breadthScore: 15, isShared: false, isHardcoded: false,
    vaultPath: 'vault/oidc/frontend', rotationSchedule: '180d',
    lastDiscovered: daysAgo(2), createdAt: daysAgo(60), updatedAt: daysAgo(2),
    sourceConnector: 'conn-azure-01', tags: { app: 'nhi-alps-ui' },
  },
  {
    nhiId: 'nhi-016', displayName: 'spiffe-mesh-sidecar', nhiType: 'SPIFFE_SVID',
    credentialType: 'CERTIFICATE', status: 'ACTIVE', riskScore: 22, riskLevel: 'LOW',
    ownerId: 'dev-L3', ownerTeam: 'Platform', environment: 'PROD',
    privilegeLevel: 'STANDARD', breadthScore: 20, isShared: false, isHardcoded: false,
    vaultPath: 'vault/spiffe/mesh', rotationSchedule: '24h',
    lastDiscovered: hoursAgo(2), createdAt: daysAgo(30), updatedAt: hoursAgo(2),
    sourceConnector: 'conn-k8s-01', tags: { mesh: 'istio' },
  },
  {
    nhiId: 'nhi-017', displayName: 'prod-db-admin-sa', nhiType: 'SERVICE_ACCOUNT',
    credentialType: 'PASSWORD', status: 'ACTIVE', riskScore: 88, riskLevel: 'CRITICAL',
    ownerId: undefined, ownerTeam: 'Data', environment: 'PROD',
    privilegeLevel: 'ADMIN', breadthScore: 75, isShared: true, isHardcoded: true,
    vaultPath: undefined, rotationSchedule: undefined,
    lastDiscovered: daysAgo(1), createdAt: daysAgo(800), updatedAt: daysAgo(1),
    sourceConnector: 'conn-ad-01', tags: { db: 'postgres', tier: 'critical' },
  },
  {
    nhiId: 'nhi-018', displayName: 'jenkins-build-agent', nhiType: 'SERVICE_ACCOUNT',
    credentialType: 'PASSWORD', status: 'ACTIVE', riskScore: 58, riskLevel: 'MEDIUM',
    ownerId: 'dev-L3', ownerTeam: 'DevOps', environment: 'STAGING',
    privilegeLevel: 'STANDARD', breadthScore: 40, isShared: false, isHardcoded: false,
    vaultPath: 'vault/ci/jenkins', rotationSchedule: '90d',
    lastDiscovered: daysAgo(3), createdAt: daysAgo(250), updatedAt: daysAgo(3),
    sourceConnector: 'conn-jenkins-01', tags: { ci: 'jenkins' },
  },
  {
    nhiId: 'nhi-019', displayName: 'test-env-api-key', nhiType: 'API_KEY',
    credentialType: 'API_KEY', status: 'ACTIVE', riskScore: 30, riskLevel: 'LOW',
    ownerId: 'dev-L3', ownerTeam: 'QA', environment: 'TEST',
    privilegeLevel: 'READ_ONLY', breadthScore: 10, isShared: false, isHardcoded: false,
    vaultPath: 'vault/test/api-key', rotationSchedule: '30d',
    lastDiscovered: daysAgo(5), createdAt: daysAgo(45), updatedAt: daysAgo(5),
    sourceConnector: 'conn-azure-01', tags: { env: 'test', team: 'qa' },
  },
  {
    nhiId: 'nhi-020', displayName: 'archived-sap-connector', nhiType: 'SERVICE_ACCOUNT',
    credentialType: 'PASSWORD', status: 'ARCHIVED', riskScore: 0, riskLevel: 'LOW',
    ownerId: 'dev-L2', ownerTeam: 'Finance', environment: 'PROD',
    privilegeLevel: 'READ_ONLY', breadthScore: 0, isShared: false, isHardcoded: false,
    vaultPath: undefined, rotationSchedule: undefined,
    lastDiscovered: daysAgo(180), createdAt: daysAgo(900), updatedAt: daysAgo(180),
    sourceConnector: 'conn-saas-01', tags: { vendor: 'sap', status: 'decommissioned' },
  },
  {
    nhiId: 'nhi-021', displayName: 'datadog-metrics-key', nhiType: 'API_KEY',
    credentialType: 'API_KEY', status: 'ACTIVE', riskScore: 32, riskLevel: 'LOW',
    ownerId: 'dev-L3', ownerTeam: 'Platform', environment: 'PROD',
    privilegeLevel: 'READ_ONLY', breadthScore: 25, isShared: false, isHardcoded: false,
    vaultPath: 'vault/monitoring/datadog', rotationSchedule: '180d',
    lastDiscovered: daysAgo(2), createdAt: daysAgo(90), updatedAt: daysAgo(2),
    sourceConnector: 'conn-saas-01', tags: { tool: 'datadog', team: 'platform' },
  },
  {
    nhiId: 'nhi-022', displayName: 'aws-cross-account-role', nhiType: 'IAM_ROLE',
    credentialType: 'OAUTH_CLIENT', status: 'ACTIVE', riskScore: 72, riskLevel: 'HIGH',
    ownerId: 'dev-L1', ownerTeam: 'Cloud', environment: 'PROD',
    privilegeLevel: 'ELEVATED', breadthScore: 65, isShared: false, isHardcoded: false,
    vaultPath: 'vault/aws/cross-account', rotationSchedule: '90d',
    lastDiscovered: daysAgo(1), createdAt: daysAgo(200), updatedAt: daysAgo(1),
    sourceConnector: 'conn-aws-01', tags: { cloud: 'aws', purpose: 'cross-account' },
  },
  {
    nhiId: 'nhi-023', displayName: 'notification-smtp-sa', nhiType: 'SERVICE_ACCOUNT',
    credentialType: 'PASSWORD', status: 'ACTIVE', riskScore: 42, riskLevel: 'MEDIUM',
    ownerId: 'dev-L2', ownerTeam: 'Notifications', environment: 'PROD',
    privilegeLevel: 'STANDARD', breadthScore: 25, isShared: false, isHardcoded: false,
    vaultPath: 'vault/notifications/smtp', rotationSchedule: '90d',
    lastDiscovered: daysAgo(4), createdAt: daysAgo(170), updatedAt: daysAgo(4),
    sourceConnector: 'conn-ad-01', tags: { service: 'smtp', team: 'notifications' },
  },
  {
    nhiId: 'nhi-024', displayName: 'gcp-storage-service-key', nhiType: 'SERVICE_ACCOUNT',
    credentialType: 'SSH_KEY', status: 'ACTIVE', riskScore: 50, riskLevel: 'MEDIUM',
    ownerId: 'dev-L3', ownerTeam: 'Data', environment: 'PROD',
    privilegeLevel: 'STANDARD', breadthScore: 35, isShared: false, isHardcoded: false,
    vaultPath: 'vault/gcp/storage', rotationSchedule: '180d',
    lastDiscovered: daysAgo(2), createdAt: daysAgo(140), updatedAt: daysAgo(2),
    sourceConnector: 'conn-gcp-01', tags: { cloud: 'gcp', service: 'storage' },
  },
  {
    nhiId: 'nhi-025', displayName: 'pending-approval-bot', nhiType: 'RPA_BOT',
    credentialType: 'TOKEN', status: 'PENDING', riskScore: 15, riskLevel: 'LOW',
    ownerId: 'dev-L2', ownerTeam: 'Automation', environment: 'DEV',
    privilegeLevel: 'READ_ONLY', breadthScore: 10, isShared: false, isHardcoded: false,
    vaultPath: undefined, rotationSchedule: undefined,
    lastDiscovered: daysAgo(1), createdAt: daysAgo(2), updatedAt: daysAgo(1),
    sourceConnector: 'conn-ad-01', tags: { status: 'pending_approval' },
  },
]

// ── Posture Issues ────────────────────────────────────────────────────────────
export const PostureIssues: PostureIssue[] = [
  {
    issueId: 'pi-001', nhiId: 'nhi-001', nhiName: 'prod-payments-svc',
    issueType: 'EXCESS_PERMISSIONS', severity: 'CRITICAL', status: 'OPEN',
    detectedAt: daysAgo(5),
    details: { permissionsGranted: 42, permissionsUsed: 8, suggestion: 'Apply least-privilege policy' },
  },
  {
    issueId: 'pi-002', nhiId: 'nhi-001', nhiName: 'prod-payments-svc',
    issueType: 'SHARED_ACCOUNT', severity: 'HIGH', status: 'OPEN',
    detectedAt: daysAgo(10),
    details: { sharedBy: ['payments-worker-1', 'payments-worker-2', 'payments-cron'], count: 3 },
  },
  {
    issueId: 'pi-003', nhiId: 'nhi-001', nhiName: 'prod-payments-svc',
    issueType: 'PLAINTEXT_FOUND', severity: 'CRITICAL', status: 'ACKNOWLEDGED',
    detectedAt: daysAgo(2),
    details: { location: 'deployment/payments-svc.yaml', lineNumber: 47, snippetHash: 'a3f9c2...' },
  },
  {
    issueId: 'pi-004', nhiId: 'nhi-002', nhiName: 'github-actions-token',
    issueType: 'EXCESS_PERMISSIONS', severity: 'HIGH', status: 'OPEN',
    detectedAt: daysAgo(7),
    details: { scopes: ['repo', 'admin:org', 'delete_repo'], unusedScopes: ['admin:org', 'delete_repo'] },
  },
  {
    issueId: 'pi-005', nhiId: 'nhi-003', nhiName: 'k8s-default-sa',
    issueType: 'NO_OWNER', severity: 'MEDIUM', status: 'OPEN',
    detectedAt: daysAgo(14),
    details: { reason: 'No ownerId mapped, team is set but individual owner missing' },
  },
  {
    issueId: 'pi-006', nhiId: 'nhi-003', nhiName: 'k8s-default-sa',
    issueType: 'ENV_NOT_SEGREGATED', severity: 'HIGH', status: 'OPEN',
    detectedAt: daysAgo(8),
    details: { usedInEnvironments: ['PROD', 'STAGING', 'DEV'], expectedEnvironments: ['PROD'] },
  },
  {
    issueId: 'pi-007', nhiId: 'nhi-005', nhiName: 'rds-backup-agent',
    issueType: 'STALE_ACCOUNT', severity: 'MEDIUM', status: 'OPEN',
    detectedAt: daysAgo(15),
    details: { lastUsedAt: daysAgo(90), staleDays: 90, threshold: 60 },
  },
  {
    issueId: 'pi-008', nhiId: 'nhi-007', nhiName: 'hashicorp-vault-root',
    issueType: 'NO_OWNER', severity: 'CRITICAL', status: 'OPEN',
    detectedAt: daysAgo(3),
    details: { reason: 'Root token has no assigned owner in CMDB' },
  },
  {
    issueId: 'pi-009', nhiId: 'nhi-007', nhiName: 'hashicorp-vault-root',
    issueType: 'EXCESS_PERMISSIONS', severity: 'CRITICAL', status: 'OPEN',
    detectedAt: daysAgo(3),
    details: { note: 'Root token grants unrestricted access — should be replaced with scoped AppRole' },
  },
  {
    issueId: 'pi-010', nhiId: 'nhi-011', nhiName: 'prod-api-gateway-key',
    issueType: 'NO_OWNER', severity: 'HIGH', status: 'OPEN',
    detectedAt: daysAgo(20),
    details: { reason: 'Key found in environment config with no owner field' },
  },
  {
    issueId: 'pi-011', nhiId: 'nhi-011', nhiName: 'prod-api-gateway-key',
    issueType: 'SHARED_ACCOUNT', severity: 'HIGH', status: 'OPEN',
    detectedAt: daysAgo(20),
    details: { sharedBy: ['gateway-svc', 'rate-limiter', 'analytics-proxy'], count: 3 },
  },
  {
    issueId: 'pi-012', nhiId: 'nhi-014', nhiName: 'legacy-ftp-service',
    issueType: 'STALE_ACCOUNT', severity: 'LOW', status: 'REMEDIATED',
    detectedAt: daysAgo(30), remediatedAt: daysAgo(5), remediatedBy: 'dev-L2',
    details: { lastUsedAt: daysAgo(120), staleDays: 120, resolution: 'Account archived' },
  },
  {
    issueId: 'pi-013', nhiId: 'nhi-017', nhiName: 'prod-db-admin-sa',
    issueType: 'EXCESS_PERMISSIONS', severity: 'CRITICAL', status: 'OPEN',
    detectedAt: daysAgo(4),
    details: { permissionsGranted: 28, permissionsUsed: 4, role: 'db_admin' },
  },
  {
    issueId: 'pi-014', nhiId: 'nhi-017', nhiName: 'prod-db-admin-sa',
    issueType: 'PLAINTEXT_FOUND', severity: 'CRITICAL', status: 'OPEN',
    detectedAt: daysAgo(1),
    details: { location: 'helm/values-prod.yaml', lineNumber: 112, key: 'db.adminPassword' },
  },
  {
    issueId: 'pi-015', nhiId: 'nhi-013', nhiName: 'cert-ingress-wildcard',
    issueType: 'STALE_ACCOUNT', severity: 'HIGH', status: 'OPEN',
    detectedAt: daysAgo(1),
    details: { certExpiresInDays: 12, threshold: 30, domain: '*.nhi-alps.io' },
  },
]

// ── Alerts ────────────────────────────────────────────────────────────────────
export const Alerts: Alert[] = [
  {
    alertId: 'alt-001', nhiId: 'nhi-001', nhiName: 'prod-payments-svc',
    alertType: 'TIME_OF_DAY', severity: 'SEV1', status: 'OPEN',
    description: 'prod-payments-svc authenticated at 02:47 UTC — outside normal business hours',
    detectedAt: hoursAgo(3),
    timeline: [
      { timestamp: hoursAgo(3), actor: 'system', action: 'DETECTED', detail: 'Anomalous auth time' },
    ],
    forensicData: { normalWindowStart: '08:00', normalWindowEnd: '20:00', anomalyTime: '02:47' },
  },
  {
    alertId: 'alt-002', nhiId: 'nhi-007', nhiName: 'hashicorp-vault-root',
    alertType: 'PRIV_ESCALATION', severity: 'SEV1', status: 'OPEN',
    description: 'Vault root token used for secrets rotation — potential privilege escalation',
    detectedAt: hoursAgo(1),
    timeline: [
      { timestamp: hoursAgo(1), actor: 'system', action: 'DETECTED', detail: 'Root token operation detected' },
    ],
    forensicData: { operation: 'secret/rotate', callerIp: '10.0.4.22', callerIdentity: 'unknown' },
  },
  {
    alertId: 'alt-003', nhiId: 'nhi-011', nhiName: 'prod-api-gateway-key',
    alertType: 'VOLUME_SPIKE', severity: 'SEV2', status: 'ACKNOWLEDGED',
    description: 'API gateway key call volume 3.8× above baseline in last 15 minutes',
    detectedAt: hoursAgo(6), assignedTo: 'dev-L2',
    timeline: [
      { timestamp: hoursAgo(6), actor: 'system', action: 'DETECTED', detail: '3.8× volume spike' },
      { timestamp: hoursAgo(5), actor: 'dev-L2', action: 'ACKNOWLEDGED', detail: 'Investigating load test' },
    ],
    forensicData: { baseline: 120, observed: 456, windowMinutes: 15 },
  },
  {
    alertId: 'alt-004', nhiId: 'nhi-003', nhiName: 'k8s-default-sa',
    alertType: 'CROSS_ENV', severity: 'SEV2', status: 'OPEN',
    description: 'k8s-default-sa token used across PROD, STAGING, and DEV namespaces',
    detectedAt: hoursAgo(12),
    timeline: [
      { timestamp: hoursAgo(12), actor: 'system', action: 'DETECTED', detail: 'Cross-environment token use' },
    ],
    forensicData: { environments: ['PROD', 'STAGING', 'DEV'], sourceNamespace: 'default' },
  },
  {
    alertId: 'alt-005', nhiId: 'nhi-002', nhiName: 'github-actions-token',
    alertType: 'GEO_ANOMALY', severity: 'SEV2', status: 'RESOLVED',
    description: 'GitHub Actions token used from IP in unexpected region (Eastern Europe)',
    detectedAt: daysAgo(2), resolvedAt: daysAgo(1),
    timeline: [
      { timestamp: daysAgo(2), actor: 'system', action: 'DETECTED', detail: 'Geo anomaly' },
      { timestamp: daysAgo(2), actor: 'dev-L2', action: 'INVESTIGATED', detail: 'Confirmed VPN exit node' },
      { timestamp: daysAgo(1), actor: 'dev-L2', action: 'RESOLVED', detail: 'False positive — team VPN' },
    ],
  },
  {
    alertId: 'alt-006', nhiId: 'nhi-017', nhiName: 'prod-db-admin-sa',
    alertType: 'CRED_SHARING', severity: 'SEV1', status: 'OPEN',
    description: 'prod-db-admin-sa credentials appear to be shared across 3 different applications',
    detectedAt: hoursAgo(8),
    timeline: [
      { timestamp: hoursAgo(8), actor: 'system', action: 'DETECTED', detail: 'Multiple concurrent sessions with same credential' },
    ],
    forensicData: { concurrentSessions: 3, sourceIps: ['10.0.1.5', '10.0.2.8', '10.0.3.12'] },
  },
  {
    alertId: 'alt-007', nhiId: 'nhi-022', nhiName: 'aws-cross-account-role',
    alertType: 'LATERAL_MOVEMENT', severity: 'SEV2', status: 'OPEN',
    description: 'Cross-account role assumed from an unexpected source account',
    detectedAt: hoursAgo(4),
    timeline: [
      { timestamp: hoursAgo(4), actor: 'system', action: 'DETECTED', detail: 'Unexpected AssumeRole source' },
    ],
    forensicData: { expectedSourceAccount: '123456789012', observedSourceAccount: '987654321098' },
  },
  {
    alertId: 'alt-008', nhiId: 'nhi-013', nhiName: 'cert-ingress-wildcard',
    alertType: 'STALE_ACTIVE', severity: 'SEV3', status: 'OPEN',
    description: 'Wildcard certificate expires in 12 days — automated renewal appears blocked',
    detectedAt: daysAgo(1),
    timeline: [
      { timestamp: daysAgo(1), actor: 'system', action: 'DETECTED', detail: 'Cert expiry < 14 days threshold' },
    ],
    forensicData: { expiresAt: new Date(Date.now() + 12 * 86400 * 1000).toISOString(), certManager: 'cert-manager' },
  },
]

// ── Connectors ────────────────────────────────────────────────────────────────
export const Connectors: ConnectorConfig[] = [
  {
    connectorId: 'conn-ad-01', connectorType: 'AD',
    displayName: 'Azure Active Directory', status: 'ACTIVE',
    config: { tenant: 'nhi-alps.io', syncInterval: '1h' },
    lastTestAt: daysAgo(1), lastRunAt: hoursAgo(1), createdAt: daysAgo(300),
  },
  {
    connectorId: 'conn-azure-01', connectorType: 'CLOUD_AZURE',
    displayName: 'Azure Cloud (Subscription)', status: 'ACTIVE',
    config: { subscriptionId: 'sub-12345', resourceGroup: 'nhi-rg-prod' },
    lastTestAt: daysAgo(1), lastRunAt: hoursAgo(2), createdAt: daysAgo(300),
  },
  {
    connectorId: 'conn-aws-01', connectorType: 'CLOUD_AWS',
    displayName: 'AWS Production Account', status: 'ACTIVE',
    config: { accountId: '123456789012', region: 'eu-west-1' },
    lastTestAt: daysAgo(2), lastRunAt: hoursAgo(3), createdAt: daysAgo(200),
  },
  {
    connectorId: 'conn-gcp-01', connectorType: 'CLOUD_GCP',
    displayName: 'GCP Project (data-platform)', status: 'ACTIVE',
    config: { projectId: 'data-platform-prod', region: 'europe-west1' },
    lastTestAt: daysAgo(2), lastRunAt: hoursAgo(4), createdAt: daysAgo(180),
  },
  {
    connectorId: 'conn-vault-01', connectorType: 'VAULT_HASHICORP',
    displayName: 'HashiCorp Vault (prod)', status: 'ACTIVE',
    config: { address: 'https://vault.nhi-alps.io', mountPath: 'secret' },
    lastTestAt: daysAgo(1), lastRunAt: hoursAgo(1), createdAt: daysAgo(250),
  },
  {
    connectorId: 'conn-k8s-01', connectorType: 'KUBERNETES',
    displayName: 'AKS Cluster (prod)', status: 'ACTIVE',
    config: { server: 'https://aks-prod.nhi-alps.io', namespace: 'all' },
    lastTestAt: daysAgo(1), lastRunAt: hoursAgo(1), createdAt: daysAgo(200),
  },
  {
    connectorId: 'conn-github-01', connectorType: 'GITHUB',
    displayName: 'GitHub Organization', status: 'ACTIVE',
    config: { org: 'nhi-alps-org', installationId: 'ghapp-78912' },
    lastTestAt: daysAgo(1), lastRunAt: hoursAgo(6), createdAt: daysAgo(150),
  },
  {
    connectorId: 'conn-jenkins-01', connectorType: 'CICD_JENKINS',
    displayName: 'Jenkins CI', status: 'INACTIVE',
    config: { url: 'https://jenkins.nhi-alps.io' },
    lastTestAt: daysAgo(10), createdAt: daysAgo(400),
  },
  {
    connectorId: 'conn-saas-01', connectorType: 'SAAS',
    displayName: 'SaaS Integrations (Stripe/Salesforce)', status: 'ACTIVE',
    config: { provider: 'custom', webhookEnabled: 'true' },
    lastTestAt: daysAgo(3), lastRunAt: daysAgo(1), createdAt: daysAgo(100),
  },
  {
    connectorId: 'conn-cyberark-01', connectorType: 'VAULT_CYBERARK',
    displayName: 'CyberArk PAM', status: 'ERROR',
    config: { pvwaUrl: 'https://cyberark.nhi-alps.io', authMethod: 'ldap' },
    lastTestAt: daysAgo(1), createdAt: daysAgo(50),
  },
  {
    connectorId: 'conn-demo-01', connectorType: 'DEMO',
    displayName: '⚡ Demo Data Source (1,000+ NHIs)', status: 'ACTIVE',
    config: { nhiCount: '1200', mode: 'realistic' },
    lastTestAt: undefined, lastRunAt: undefined, createdAt: daysAgo(0),
  },
]

// ── Discovery Runs ────────────────────────────────────────────────────────────
export const DiscoveryRuns: DiscoveryRun[] = [
  {
    runId: uuid(), connectorType: 'AD', status: 'COMPLETED',
    startedAt: hoursAgo(2), completedAt: hoursAgo(1),
    nhisDiscovered: 145, nhisNew: 3, nhisUpdated: 12, nhisRemoved: 0,
    errors: [], triggeredBy: 'scheduler',
  },
  {
    runId: uuid(), connectorType: 'CLOUD_AZURE', status: 'COMPLETED',
    startedAt: hoursAgo(3), completedAt: hoursAgo(2),
    nhisDiscovered: 87, nhisNew: 1, nhisUpdated: 5, nhisRemoved: 2,
    errors: [], triggeredBy: 'dev-L2',
  },
  {
    runId: uuid(), connectorType: 'KUBERNETES', status: 'COMPLETED',
    startedAt: daysAgo(1), completedAt: daysAgo(1),
    nhisDiscovered: 62, nhisNew: 0, nhisUpdated: 8, nhisRemoved: 1,
    errors: [], triggeredBy: 'scheduler',
  },
  {
    runId: uuid(), connectorType: 'VAULT_CYBERARK', status: 'FAILED',
    startedAt: daysAgo(1), completedAt: daysAgo(1),
    nhisDiscovered: 0, nhisNew: 0, nhisUpdated: 0, nhisRemoved: 0,
    errors: ['Connection refused: TLS handshake failed', 'PVWA returned 503 after 3 retries'],
    triggeredBy: 'scheduler',
  },
  {
    runId: uuid(), connectorType: 'GITHUB', status: 'COMPLETED',
    startedAt: hoursAgo(7), completedAt: hoursAgo(6),
    nhisDiscovered: 34, nhisNew: 2, nhisUpdated: 3, nhisRemoved: 0,
    errors: [], triggeredBy: 'scheduler',
  },
]

// ── Compliance ────────────────────────────────────────────────────────────────
export const ComplianceScores: ComplianceScore[] = [
  { framework: 'SOC2',     score: 82, controls: 64,  passing: 52, failing: 12 },
  { framework: 'ISO_27001', score: 77, controls: 114, passing: 88, failing: 26 },
  { framework: 'PCI_DSS',  score: 71, controls: 72,  passing: 51, failing: 21 },
  { framework: 'SOX',      score: 88, controls: 38,  passing: 34, failing: 4  },
  { framework: 'DORA',     score: 65, controls: 46,  passing: 30, failing: 16 },
]

export const CertificationCampaigns: CertificationCampaign[] = [
  {
    campaignId: 'camp-001', name: 'Q1 2025 Access Certification',
    framework: 'SOC2', status: 'ACTIVE',
    nhiScope: ['nhi-001', 'nhi-002', 'nhi-007', 'nhi-011', 'nhi-017'],
    certifiers: ['dev-L1', 'dev-L2'],
    dueDate: new Date(Date.now() + 14 * 86400 * 1000).toISOString(),
    createdAt: daysAgo(7), decisions: 2, pending: 3,
  },
  {
    campaignId: 'camp-002', name: 'PCI-DSS Credential Review',
    framework: 'PCI_DSS', status: 'ACTIVE',
    nhiScope: ['nhi-001', 'nhi-006', 'nhi-011'],
    certifiers: ['dev-L4'],
    dueDate: new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
    createdAt: daysAgo(3), decisions: 0, pending: 3,
  },
  {
    campaignId: 'camp-003', name: 'ISO 27001 Annual Review 2024',
    framework: 'ISO_27001', status: 'CLOSED',
    nhiScope: ['nhi-001', 'nhi-003', 'nhi-007', 'nhi-017', 'nhi-022'],
    certifiers: ['dev-L4', 'dev-L2'],
    dueDate: daysAgo(10),
    createdAt: daysAgo(45), closedAt: daysAgo(8), decisions: 5, pending: 0,
  },
]

// ── Audit Logs ────────────────────────────────────────────────────────────────
export const AuditLogs: AuditLogEntry[] = [
  {
    eventId: uuid(), resourceId: 'nhi-001', resourceType: 'NHI',
    actorId: 'dev-L2', actorRole: 'L2', action: 'NHI_VIEWED',
    ipAddress: '10.0.1.22', timestamp: hoursAgo(1), traceId: uuid(),
  },
  {
    eventId: uuid(), resourceId: 'pi-001', resourceType: 'POSTURE_ISSUE',
    actorId: 'dev-L2', actorRole: 'L2', action: 'ISSUE_ACKNOWLEDGED',
    before: { status: 'OPEN' }, after: { status: 'ACKNOWLEDGED' },
    ipAddress: '10.0.1.22', timestamp: hoursAgo(2), traceId: uuid(),
  },
  {
    eventId: uuid(), resourceId: 'alt-003', resourceType: 'ALERT',
    actorId: 'dev-L2', actorRole: 'L2', action: 'ALERT_ACKNOWLEDGED',
    before: { status: 'OPEN' }, after: { status: 'ACKNOWLEDGED', assignedTo: 'dev-L2' },
    ipAddress: '10.0.1.22', timestamp: hoursAgo(5), traceId: uuid(),
  },
  {
    eventId: uuid(), resourceId: 'nhi-005', resourceType: 'NHI',
    actorId: 'dev-L1', actorRole: 'L1', action: 'NHI_UPDATED',
    before: { status: 'ACTIVE' }, after: { status: 'DORMANT' },
    ipAddress: '10.0.2.44', timestamp: daysAgo(1), traceId: uuid(),
  },
  {
    eventId: uuid(), resourceId: 'camp-001', resourceType: 'CERTIFICATION_CAMPAIGN',
    actorId: 'dev-L1', actorRole: 'L1', action: 'CAMPAIGN_CREATED',
    after: { campaignId: 'camp-001', framework: 'SOC2' },
    ipAddress: '10.0.2.44', timestamp: daysAgo(7), traceId: uuid(),
  },
  {
    eventId: uuid(), resourceId: 'conn-cyberark-01', resourceType: 'CONNECTOR',
    actorId: 'dev-L0', actorRole: 'L0', action: 'CONNECTOR_TEST_FAILED',
    after: { error: 'TLS handshake failed' },
    ipAddress: '10.0.0.5', timestamp: daysAgo(1), traceId: uuid(),
  },
  {
    eventId: uuid(), resourceId: 'nhi-020', resourceType: 'NHI',
    actorId: 'dev-L2', actorRole: 'L2', action: 'NHI_ARCHIVED',
    before: { status: 'DORMANT' }, after: { status: 'ARCHIVED' },
    ipAddress: '10.0.1.22', timestamp: daysAgo(180), traceId: uuid(),
  },
  {
    eventId: uuid(), resourceId: 'pi-012', resourceType: 'POSTURE_ISSUE',
    actorId: 'dev-L2', actorRole: 'L2', action: 'ISSUE_REMEDIATED',
    before: { status: 'OPEN' }, after: { status: 'REMEDIATED' },
    ipAddress: '10.0.1.22', timestamp: daysAgo(5), traceId: uuid(),
  },
  {
    eventId: uuid(), resourceId: 'nhi-025', resourceType: 'NHI',
    actorId: 'dev-L3', actorRole: 'L3', action: 'NHI_CREATED',
    after: { nhiId: 'nhi-025', displayName: 'pending-approval-bot', status: 'PENDING' },
    ipAddress: '10.0.3.88', timestamp: daysAgo(2), traceId: uuid(),
  },
  {
    eventId: uuid(), resourceId: 'alt-005', resourceType: 'ALERT',
    actorId: 'dev-L2', actorRole: 'L2', action: 'ALERT_RESOLVED',
    before: { status: 'ACKNOWLEDGED' }, after: { status: 'RESOLVED', resolution: 'False positive — team VPN' },
    ipAddress: '10.0.1.22', timestamp: daysAgo(1), traceId: uuid(),
  },
]
