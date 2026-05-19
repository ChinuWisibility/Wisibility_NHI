import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET ?? 'nhi-alps-dev-secret'

const VALID_ROLES = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5'] as const
type Role = typeof VALID_ROLES[number]

router.post('/register', async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body as {
    name: string; email: string; password: string; role: Role
  }

  if (!name || !email || !password || !role) {
    res.status(400).json({ error: 'name, email, password, and role are required' })
    return
  }
  if (!VALID_ROLES.includes(role)) {
    res.status(400).json({ error: 'Invalid role' })
    return
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' })
    return
  }

  try {
    const existing = await prisma.localUser.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.localUser.create({
      data: { email: email.toLowerCase().trim(), passwordHash, name: name.trim(), role, mfaEnabled: false },
    })

    const token = jwt.sign(
      { sub: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      data: {
        token,
        user: {
          userId: user.id, email: user.email, name: user.name,
          role: user.role, mfaEnabled: user.mfaEnabled, createdAt: user.createdAt,
        },
      },
    })
  } catch (error: any) {
    console.error('[Auth] Register error:', error)
    res.status(500).json({ error: 'Registration failed', detail: error.message })
  }
})

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string }
  console.log(`[Auth] Login attempt for: ${email}`)

  if (!email || !password) {
    console.log('[Auth] Missing email or password')
    res.status(400).json({ error: 'email and password are required' })
    return
  }

  try {
    console.log('[Auth] Searching for user in DB...')
    const user = await prisma.localUser.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user) {
      console.log(`[Auth] User not found: ${email}`)
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    console.log('[Auth] User found, verifying password...')
    const isMatch = await bcrypt.compare(password, user.passwordHash)
    
    if (!isMatch) {
      console.log('[Auth] Password mismatch')
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    console.log('[Auth] Password verified, generating token...')
    const token = jwt.sign(
      { sub: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    console.log('[Auth] Login successful')
    res.json({
      data: {
        token,
        user: {
          userId:     user.id,
          email:      user.email,
          name:       user.name,
          role:       user.role,
          mfaEnabled: user.mfaEnabled,
          createdAt:  user.createdAt,
        },
      },
    })
  } catch (error: any) {
    console.error('[Auth] Login error:', error)
    res.status(500).json({ error: 'Authentication failed', detail: error.message })
  }
})

router.post('/logout', (_req: Request, res: Response) => {
  res.json({ data: null, message: 'Logged out' })
})

export default router
