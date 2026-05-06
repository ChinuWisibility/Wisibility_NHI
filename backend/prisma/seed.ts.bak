import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client.js'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import {
  NHIs, PostureIssues, Alerts, Connectors,
  DiscoveryRuns, ComplianceScores, CertificationCampaigns, AuditLogs,
  Policies, Users,
} from '../src/db/seed.js'
import { generateDemoNHIs } from '../src/services/demo-generator.js'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // Clear in dependency order
  await prisma.certificationDecision.deleteMany()
  await prisma.certificationCampaign.deleteMany()
  await prisma.complianceScore.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.postureIssue.deleteMany()
  await prisma.alert.deleteMany()
  await prisma.discoveryRun.deleteMany()
  await prisma.nhi.deleteMany()
  await prisma.connectorConfig.deleteMany()
  await prisma.policy.deleteMany()
  await prisma.localUser.deleteMany()

  // Connectors first (discovery runs reference them)
  for (const c of Connectors) {
    await prisma.connectorConfig.create({
      data: {
        connectorId:   c.connectorId,
        connectorType: c.connectorType,
        displayName:   c.displayName,
        status:        c.status,
        config:        c.config as object,
        lastTestAt:    c.lastTestAt ? new Date(c.lastTestAt) : null,
        lastRunAt:     c.lastRunAt  ? new Date(c.lastRunAt)  : null,
        createdAt:     new Date(c.createdAt),
      },
    })
  }

  // NHIs — seed NHIs + 500 generated demo NHIs
  const demoNhis = generateDemoNHIs(500)
  const allNhis  = [...NHIs, ...demoNhis]
  for (const n of allNhis) {
    await prisma.nhi.create({
      data: {
        nhiId:            n.nhiId,
        displayName:      n.displayName,
        nhiType:          n.nhiType,
        credentialType:   n.credentialType,
        status:           n.status,
        riskScore:        n.riskScore,
        riskLevel:        n.riskLevel,
        ownerId:          n.ownerId         ?? null,
        ownerTeam:        n.ownerTeam       ?? null,
        environment:      n.environment,
        privilegeLevel:   n.privilegeLevel,
        breadthScore:     n.breadthScore,
        isShared:         n.isShared,
        isHardcoded:      n.isHardcoded,
        vaultPath:        n.vaultPath       ?? null,
        rotationSchedule: n.rotationSchedule ?? null,
        certExpiry:       n.certExpiry ? new Date(n.certExpiry) : null,
        lastDiscovered:   new Date(n.lastDiscovered),
        createdAt:        new Date(n.createdAt),
        sourceConnector:  n.sourceConnector,
        tags:             n.tags as object,
      },
    })
  }
  console.log(`  ✓ ${allNhis.length} NHIs (${NHIs.length} seed + ${demoNhis.length} demo)`)

  for (const i of PostureIssues) {
    await prisma.postureIssue.create({
      data: {
        issueId:      i.issueId,
        nhiId:        i.nhiId,
        nhiName:      i.nhiName     ?? null,
        issueType:    i.issueType,
        severity:     i.severity,
        status:       i.status,
        detectedAt:   new Date(i.detectedAt),
        remediatedAt: i.remediatedAt ? new Date(i.remediatedAt) : null,
        remediatedBy: i.remediatedBy ?? null,
        details:      i.details as object,
      },
    })
  }
  console.log(`  ✓ ${PostureIssues.length} posture issues`)

  for (const a of Alerts) {
    await prisma.alert.create({
      data: {
        alertId:      a.alertId,
        nhiId:        a.nhiId,
        nhiName:      a.nhiName     ?? null,
        alertType:    a.alertType,
        severity:     a.severity,
        description:  a.description,
        status:       a.status,
        detectedAt:   new Date(a.detectedAt),
        resolvedAt:   a.resolvedAt  ? new Date(a.resolvedAt)  : null,
        assignedTo:   a.assignedTo  ?? null,
        itsmTicketId: a.itsmTicketId ?? null,
        forensicData: (a.forensicData ?? null) as object | null,
        timeline:     a.timeline as object[],
      },
    })
  }
  console.log(`  ✓ ${Alerts.length} alerts`)

  for (const r of DiscoveryRuns) {
    await prisma.discoveryRun.create({
      data: {
        runId:          r.runId,
        connectorType:  r.connectorType,
        startedAt:      new Date(r.startedAt),
        completedAt:    r.completedAt ? new Date(r.completedAt) : null,
        status:         r.status,
        nhisDiscovered: r.nhisDiscovered,
        nhisNew:        r.nhisNew,
        nhisUpdated:    r.nhisUpdated,
        nhisRemoved:    r.nhisRemoved,
        errors:         r.errors,
        triggeredBy:    r.triggeredBy,
      },
    })
  }
  console.log(`  ✓ ${DiscoveryRuns.length} discovery runs`)

  for (const s of ComplianceScores) {
    await prisma.complianceScore.create({ data: s })
  }
  console.log(`  ✓ ${ComplianceScores.length} compliance scores`)

  for (const c of CertificationCampaigns) {
    await prisma.certificationCampaign.create({
      data: {
        campaignId: c.campaignId,
        name:       c.name,
        framework:  c.framework,
        status:     c.status,
        nhiScope:   c.nhiScope,
        certifiers: c.certifiers,
        dueDate:    new Date(c.dueDate),
        createdAt:  new Date(c.createdAt),
        closedAt:   c.closedAt ? new Date(c.closedAt) : null,
        decisions:  c.decisions,
        pending:    c.pending,
      },
    })
  }
  console.log(`  ✓ ${CertificationCampaigns.length} cert campaigns`)

  for (const l of AuditLogs) {
    await prisma.auditLog.create({
      data: {
        eventId:      l.eventId,
        resourceId:   l.resourceId,
        resourceType: l.resourceType,
        actorId:      l.actorId,
        actorRole:    l.actorRole,
        action:       l.action,
        before:       (l.before ?? null) as object | null,
        after:        (l.after  ?? null) as object | null,
        ipAddress:    l.ipAddress,
        timestamp:    new Date(l.timestamp),
        traceId:      l.traceId,
      },
    })
  }
  console.log(`  ✓ ${AuditLogs.length} audit logs`)

  for (const p of Policies) {
    await prisma.policy.create({
      data: {
        policyId:    p.policyId,
        name:        p.name,
        description: p.description,
        enabled:     p.enabled,
        filters:     p.filters as object,
        action:      p.action,
        createdAt:   new Date(p.createdAt),
        createdBy:   p.createdBy,
      },
    })
  }
  console.log(`  ✓ ${Policies.length} policies`)

  // Demo users for UserManagement page
  for (const u of Users) {
    await prisma.localUser.create({
      data: {
        id:           u.userId,
        email:        u.email,
        passwordHash: '',
        name:         u.name,
        role:         u.role,
        mfaEnabled:   u.mfaEnabled,
        createdAt:    new Date(u.createdAt),
      },
    })
  }
  console.log(`  ✓ ${Users.length} users`)

  console.log('✅ Seed complete')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); await pool.end() })
