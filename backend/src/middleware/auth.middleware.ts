import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import jwksRsa from 'jwks-rsa'

const TENANT_ID   = process.env.AZURE_TENANT_ID  ?? ''
const CLIENT_ID   = process.env.AZURE_CLIENT_ID  ?? ''
const JWT_SECRET  = process.env.JWT_SECRET        ?? 'nhi-alps-dev-secret'
const IS_DEV      = process.env.NODE_ENV !== 'production'

export interface AuthRequest extends Request {
  userId?:   string
  userRole?: string
  email?:    string
}

// JWKS client for validating Entra ID RS256 tokens
const jwksClient = TENANT_ID
  ? jwksRsa({
      jwksUri: `https://login.microsoftonline.com/${TENANT_ID}/discovery/v2.0/keys`,
      cache:   true,
      rateLimit: true,
    })
  : null

function getKey(header: jwt.JwtHeader, cb: jwt.SigningKeyCallback) {
  if (!jwksClient) { cb(new Error('JWKS client not configured')); return }
  jwksClient.getSigningKey(header.kid ?? '', (err, key) => {
    cb(err, key?.getPublicKey())
  })
}

function extractRoleFromClaims(claims: Record<string, unknown>): string {
  const roles = claims.roles as string[] | undefined
  if (roles?.length) {
    const prefix = roles[0].split('.')[0]
    if (/^L[0-5]$/.test(prefix)) return prefix
  }
  // Fallback: check custom role claim set by email-login path
  if (typeof claims.role === 'string') return claims.role
  return 'L5'
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' })
    return
  }
  const token = header.slice(7)

  // ── Dev bypass tokens (local dev only) ───────────────────────────────────
  if (IS_DEV && (token.startsWith('dev-jwt-') || token.startsWith('local-jwt-'))) {
    const parts    = token.split('-')
    req.userId     = parts.slice(2).join('-')
    req.userRole   = parts[2] ?? 'L5'
    req.email      = `${req.userId}@nhi.local`
    next()
    return
  }

  const decoded = jwt.decode(token, { complete: true })
  if (!decoded || typeof decoded.payload !== 'object') {
    res.status(401).json({ error: 'Invalid token format' })
    return
  }

  const { header: tokenHeader, payload } = decoded
  const claims = payload as Record<string, unknown>

  // ── Entra ID RS256 token ──────────────────────────────────────────────────
  if (tokenHeader.alg === 'RS256' && jwksClient) {
    jwt.verify(token, getKey, {
      audience: `api://${CLIENT_ID}`,
      issuer:   `https://sts.windows.net/${TENANT_ID}/`,
    }, (err, verified) => {
      if (err) { res.status(401).json({ error: 'Token verification failed', detail: err.message }); return }
      const c    = verified as Record<string, unknown>
      req.userId   = c.oid as string ?? c.sub as string
      req.email    = c.preferred_username as string ?? c.email as string
      req.userRole = extractRoleFromClaims(c)
      next()
    })
    return
  }

  // ── Local JWT (HS256 — email login, production path) ─────────────────────
  try {
    const verified = jwt.verify(token, JWT_SECRET) as Record<string, unknown>
    req.userId   = verified.sub as string
    req.userRole = extractRoleFromClaims(verified)
    req.email    = verified.email as string
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
