import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { authMiddleware } from './middleware/auth.middleware.js'
import { requireMinRole } from './middleware/rbac.middleware.js'
import authRoutes       from './routes/auth.routes.js'
import nhiRoutes        from './routes/nhi.routes.js'
import postureRoutes    from './routes/posture.routes.js'
import alertsRoutes     from './routes/alerts.routes.js'
import discoveryRoutes  from './routes/discovery.routes.js'
import connectorsRoutes from './routes/connectors.routes.js'
import complianceRoutes from './routes/compliance.routes.js'
import auditRoutes      from './routes/audit.routes.js'
import demoRoutes       from './routes/demo.routes.js'
import policiesRoutes   from './routes/policies.routes.js'
import securityRoutes   from './routes/security.routes.js'
import { prisma }       from './lib/prisma.js'

const app  = express()
const PORT = process.env.PORT ?? 4000

app.use(cors({ origin: '*' }))
app.use(express.json())

// Simple request logger
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  next()
})

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

app.use('/auth', authRoutes)

app.use(authMiddleware)

app.use('/nhi',            requireMinRole('L5'), nhiRoutes)
app.use('/posture',        requireMinRole('L5'), postureRoutes)
app.use('/alerts',         requireMinRole('L5'), alertsRoutes)
app.use('/discovery',      requireMinRole('L5'), discoveryRoutes)
app.use('/connectors',     requireMinRole('L5'), connectorsRoutes)
app.use('/compliance',     requireMinRole('L5'), complianceRoutes)
app.use('/certifications', requireMinRole('L5'), complianceRoutes)
app.use('/audit',          requireMinRole('L5'), auditRoutes)
app.use('/demo',           requireMinRole('L5'), demoRoutes)
app.use('/policies',       requireMinRole('L5'), policiesRoutes)
app.use('/security',       requireMinRole('L5'), securityRoutes)

app.get('/users', requireMinRole('L0'), async (_req, res) => {
  const users = await prisma.localUser.findMany({
    select: { id: true, email: true, name: true, role: true, mfaEnabled: true, createdAt: true },
    orderBy: { role: 'asc' },
  })
  res.json({
    data: users.map((u) => ({ userId: u.id, email: u.email, name: u.name, role: u.role, mfaEnabled: u.mfaEnabled, createdAt: u.createdAt })),
  })
})

app.listen(PORT, () => {
  console.log(`NHI ALPS backend running on http://localhost:${PORT}`)
})
