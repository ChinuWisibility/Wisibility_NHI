import { PrismaClient } from '../src/generated/prisma/client.js'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcrypt'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const email = 'admin@nhi.local'
  const password = 'Admin@123'
  const saltRounds = 10

  console.log(`Checking for user ${email}...`)
  const existing = await prisma.localUser.findUnique({ where: { email } })

  if (existing) {
    console.log('User already exists.')
    return
  }

  const hash = await bcrypt.hash(password, saltRounds)

  await prisma.localUser.create({
    data: {
      email,
      passwordHash: hash,
      name: 'Super Admin',
      role: 'L0',
      mfaEnabled: false,
    },
  })

  console.log(`✅ Default admin created: ${email} / ${password}`)
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
