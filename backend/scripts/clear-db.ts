import { PrismaClient } from '../src/generated/prisma/client.js'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🧹 Clearing database...')

  // Delete in order to respect foreign keys
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
  // Note: We keep local users so you can still log in
  // await prisma.localUser.deleteMany()

  console.log('✅ Database cleared (except users)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
