import { Router } from 'express'
import jwt from 'jsonwebtoken'
import type { Request, Response } from 'express'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET ?? 'nhi-alps-dev-secret'

const DEV_ACCOUNTS: Record<string, { password: string; role: string; name: string }> = {
  'admin@nhi.local':     { password: 'Admin@123',   role: 'L0', name: 'Super Admin' },
  'manager@nhi.local':   { password: 'Manager@123', role: 'L1', name: 'Program Manager' },
  'analyst@nhi.local':   { password: 'Analyst@123', role: 'L2', name: 'Security Analyst' },
  'developer@nhi.local': { password: 'Dev@123',     role: 'L3', name: 'Developer' },
  'auditor@nhi.local':   { password: 'Audit@123',   role: 'L4', name: 'Auditor' },
  'viewer@nhi.local':    { password: 'View@123',    role: 'L5', name: 'Viewer' },
}

router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string }
  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' })
    return
  }

  const account = DEV_ACCOUNTS[email.toLowerCase().trim()]
  if (!account || account.password !== password) {
    res.status(401).json({ error: 'Invalid email or password' })
    return
  }

  const token = jwt.sign({ sub: `backend-${account.role}`, role: account.role }, JWT_SECRET, { expiresIn: '8h' })
  res.json({
    data: {
      token,
      user: {
        userId:     `backend-${account.role}`,
        email:      email.toLowerCase().trim(),
        name:       account.name,
        role:       account.role,
        mfaEnabled: false,
        createdAt:  new Date().toISOString(),
      },
    },
  })
})

router.post('/logout', (_req: Request, res: Response) => {
  res.json({ data: null, message: 'Logged out' })
})

export default router
