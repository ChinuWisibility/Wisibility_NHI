import express from 'express'
import cors from 'cors'
import { authMiddleware } from './middleware/auth.middleware.js'
import { requireMinRole, requireRole } from './middleware/rbac.middleware.js'
import authRoutes       from './routes/auth.routes.js'
import nhiRoutes        from './routes/nhi.routes.js'
import postureRoutes    from './routes/posture.routes.js'
import alertsRoutes     from './routes/alerts.routes.js'
import discoveryRoutes  from './routes/discovery.routes.js'
import connectorsRoutes from './routes/connectors.routes.js'
import complianceRoutes from './routes/compliance.routes.js'
import auditRoutes      from './routes/audit.routes.js'
import demoRoutes       from './routes/demo.routes.js'

const app  = express()
const PORT = process.env.PORT ?? 4000

app.use(cors({ origin: '*' }))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

app.use('/auth', authRoutes)

app.use(authMiddleware)

app.use('/nhi',            requireMinRole('L5'), nhiRoutes)
app.use('/posture',        requireMinRole('L5'), postureRoutes)
app.use('/alerts',         requireMinRole('L5'), alertsRoutes)
app.use('/discovery',      requireMinRole('L3'), discoveryRoutes)   // L3+ can trigger scans
app.use('/connectors',     requireMinRole('L2'), connectorsRoutes)  // L2+ manage connectors
app.use('/compliance',     requireMinRole('L4'), complianceRoutes)  // L4 = auditor
app.use('/certifications', requireMinRole('L4'), complianceRoutes)
app.use('/audit',          requireRole('L0','L1','L4'), auditRoutes) // admins + auditors
app.use('/demo',           requireMinRole('L3'), demoRoutes)

app.listen(PORT, () => {
  console.log(`NHI ALPS backend running on http://localhost:${PORT}`)
})
