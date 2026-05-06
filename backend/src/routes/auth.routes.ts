import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET ?? 'nhi-alps-dev-secret'

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
