import { v4 as uuid } from 'uuid'
import { prisma } from '../lib/prisma.js'
import { computeRiskScore } from './risk-scorer.js'

export async function processNHIs(nhis: any[]) {
  const results: string[] = []
  for (const n of nhis) {
    const createdAt = n.createdAt || new Date().toISOString()
    const computed = computeRiskScore({
      privilegeLevel: n.privilegeLevel || 'STANDARD',
      breadthScore:   Number(n.breadthScore) || 0,
      createdAt,
      isHardcoded:    String(n.isHardcoded) === 'true',
      isShared:       String(n.isShared) === 'true',
      ownerId:        n.ownerId,
      vaultPath:      n.vaultPath,
      certExpiry:     n.certExpiry,
    })
    const score = n.riskScore != null ? Number(n.riskScore) : computed.score
    const level = n.riskLevel || computed.level

    const nhiId = n.nhiId || uuid()
    const created = await prisma.nhi.upsert({
      where: { nhiId },
      update: {
        displayName:      n.displayName || 'Unknown NHI',
        nhiType:          n.nhiType || 'API_KEY',
        credentialType:   n.credentialType || 'API_KEY',
        status:           n.status || 'ACTIVE',
        ownerId:          n.ownerId || null,
        ownerTeam:        n.ownerTeam || 'Unknown',
        environment:      n.environment || 'DEV',
        privilegeLevel:   n.privilegeLevel || 'STANDARD',
        breadthScore:     Number(n.breadthScore) || 0,
        isShared:         String(n.isShared) === 'true',
        isHardcoded:      String(n.isHardcoded) === 'true',
        vaultPath:        n.vaultPath || null,
        rotationSchedule: n.rotationSchedule || null,
        certExpiry:       n.certExpiry ? new Date(n.certExpiry) : null,
        lastDiscovered:   new Date(),
        sourceConnector:  n.sourceConnector || 'MANUAL',
        tags:             typeof n.tags === 'string' ? JSON.parse(n.tags) : (n.tags || {}),
        riskScore:        score,
        riskLevel:        level,
        updatedAt:        new Date(),
      },
      create: {
        nhiId,
        displayName:      n.displayName || 'Unknown NHI',
        nhiType:          n.nhiType || 'API_KEY',
        credentialType:   n.credentialType || 'API_KEY',
        status:           n.status || 'ACTIVE',
        riskScore:        score,
        riskLevel:        level,
        ownerId:          n.ownerId || null,
        ownerTeam:        n.ownerTeam || 'Unknown',
        environment:      n.environment || 'DEV',
        privilegeLevel:   n.privilegeLevel || 'STANDARD',
        breadthScore:     Number(n.breadthScore) || 0,
        isShared:         String(n.isShared) === 'true',
        isHardcoded:      String(n.isHardcoded) === 'true',
        vaultPath:        n.vaultPath || null,
        rotationSchedule: n.rotationSchedule || null,
        certExpiry:       n.certExpiry ? new Date(n.certExpiry) : null,
        lastDiscovered:   new Date(),
        createdAt:        new Date(createdAt),
        sourceConnector:  n.sourceConnector || 'MANUAL',
        tags:             typeof n.tags === 'string' ? JSON.parse(n.tags) : (n.tags || {}),
      },
    })
    results.push(created.nhiId)
  }
  return results
}
