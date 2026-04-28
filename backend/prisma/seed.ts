import { PrismaClient } from '../src/generated/prisma/client.js'
import {
  NHIs, PostureIssues, Alerts, Connectors,
  DiscoveryRuns, ComplianceScores, CertificationCampaigns, AuditLogs,
} from '../src/db/seed.js'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  await prisma.$transaction([
    prisma.nhi.deleteMany(),
    prisma.connectorConfig.deleteMany(),
    prisma.complianceScore.deleteMany(),
    prisma.certificationCampaign.deleteMany(),
    prisma.auditLog.deleteMany(),
  ])

  // Connectors first (discovery runs reference them)
  for (const c of Connectors) {
    await prisma.connectorConfig.upsert({
      where:  { connectorId: c.connectorId },
      update: {},
      create: {
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

  // NHIs (posture issues + alerts depend on these)
  for (const n of NHIs) {
    await prisma.nhi.upsert({
      where:  { nhiId: n.nhiId },
      update: {},
      create: {
        nhiId:           n.nhiId,
        displayName:     n.displayName,
        nhiType:         n.nhiType,
        credentialType:  n.credentialType,
        status:          n.status,
        riskScore:       n.riskScore,
        riskLevel:       n.riskLevel,
        ownerId:         n.ownerId  ?? null,
        ownerTeam:       n.ownerTeam ?? null,
        environment:     n.environment,
        privilegeLevel:  n.privilegeLevel,
        breadthScore:    n.breadthScore,
        isShared:        n.isShared,
        isHardcoded:     n.isHardcoded,
        vaultPath:       n.vaultPath       ?? null,
        rotationSchedule: n.rotationSchedule ?? null,
        certExpiry:      n.certExpiry ? new Date(n.certExpiry) : null,
        lastDiscovered:  new Date(n.lastDiscovered),
        createdAt:       new Date(n.createdAt),
        sourceConnector: n.sourceConnector,
        tags:            n.tags as object,
      },
    })
  }

  for (const i of PostureIssues) {
    await prisma.postureIssue.upsert({
      where:  { issueId: i.issueId },
      update: {},
      create: {
        issueId:      i.issueId,
        nhiId:        i.nhiId,
        nhiName:      i.nhiName ?? null,
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

  for (const a of Alerts) {
    await prisma.alert.upsert({
      where:  { alertId: a.alertId },
      update: {},
      create: {
        alertId:      a.alertId,
        nhiId:        a.nhiId,
        nhiName:      a.nhiName ?? null,
        alertType:    a.alertType,
        severity:     a.severity,
        description:  a.description,
        status:       a.status,
        detectedAt:   new Date(a.detectedAt),
        resolvedAt:   a.resolvedAt ? new Date(a.resolvedAt) : null,
        assignedTo:   a.assignedTo   ?? null,
        itsmTicketId: a.itsmTicketId ?? null,
        forensicData: (a.forensicData ?? null) as object | null,
        timeline:     a.timeline as object[],
      },
    })
  }

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

  for (const s of ComplianceScores) {
    await prisma.complianceScore.upsert({
      where:  { framework: s.framework },
      update: { score: s.score, controls: s.controls, passing: s.passing, failing: s.failing },
      create: s,
    })
  }

  for (const c of CertificationCampaigns) {
    await prisma.certificationCampaign.upsert({
      where:  { campaignId: c.campaignId },
      update: {},
      create: {
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

  console.log('✓ Seed complete')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
