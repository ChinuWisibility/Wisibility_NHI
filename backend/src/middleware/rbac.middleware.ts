import type { Response, NextFunction } from 'express'
import type { AuthRequest } from './auth.middleware.js'

type Role = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5'

const ROLE_RANK: Record<Role, number> = {
  L0: 0, L1: 1, L2: 2, L3: 3, L4: 4, L5: 5,
}

// Returns middleware that allows access only to roles <= maxRole
// (lower number = more privileged)
export function requireRole(...allowedRoles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const role = req.userRole as Role | undefined
    if (!role || !allowedRoles.includes(role)) {
      res.status(403).json({ error: `Forbidden: requires one of [${allowedRoles.join(', ')}]` })
      return
    }
    next()
  }
}

// Allows any role up to and including maxRole (inclusive of more privileged)
export function requireMinRole(maxRole: Role) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const role = req.userRole as Role | undefined
    if (!role || !(role in ROLE_RANK) || ROLE_RANK[role] > ROLE_RANK[maxRole]) {
      res.status(403).json({ error: `Forbidden: requires role ${maxRole} or higher privilege` })
      return
    }
    next()
  }
}
