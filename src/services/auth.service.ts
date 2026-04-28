import api from '@/config/axiosInstance'
import { verifyLocalUser } from '@/services/localUsers.service'
import type { User, UserRole } from '@/types/user.types'

export interface EmailLoginResponse {
  token: string
  user: User
}

// Module-level token so the axios interceptor (non-React) can read the active JWT
let _emailToken: string | null = null
export const setEmailToken = (token: string | null) => { _emailToken = token }
export const getEmailToken = () => _emailToken

// Fallback dev accounts — used only when no local users match
const DEV_ACCOUNTS: Record<string, { password: string; role: UserRole; name: string }> = {
  'admin@nhi.local':     { password: 'Admin@123',   role: 'L0', name: 'Super Admin' },
  'manager@nhi.local':   { password: 'Manager@123', role: 'L1', name: 'Program Manager' },
  'analyst@nhi.local':   { password: 'Analyst@123', role: 'L2', name: 'Security Analyst' },
  'developer@nhi.local': { password: 'Dev@123',     role: 'L3', name: 'Developer' },
  'auditor@nhi.local':   { password: 'Audit@123',   role: 'L4', name: 'Auditor' },
  'viewer@nhi.local':    { password: 'View@123',    role: 'L5', name: 'Viewer' },
}

export async function loginWithEmail(email: string, password: string): Promise<EmailLoginResponse> {
  // 1. Check locally-created users first (works in both dev and prod while backend is pending)
  const localUser = await verifyLocalUser(email, password)
  if (localUser) {
    const user: User = {
      userId:     localUser.id,
      email:      localUser.email,
      name:       localUser.name,
      role:       localUser.role,
      mfaEnabled: false,
      createdAt:  localUser.createdAt,
    }
    return { token: `local-jwt-${localUser.id}`, user }
  }

  // 2. In dev — fall back to hardcoded dev accounts
  if (import.meta.env.DEV) {
    const account = DEV_ACCOUNTS[email.toLowerCase().trim()]
    if (account && account.password === password) {
      const user: User = {
        userId:     `dev-${account.role}`,
        email:      email.toLowerCase().trim(),
        name:       account.name,
        role:       account.role,
        mfaEnabled: false,
        createdAt:  new Date().toISOString(),
      }
      return { token: `dev-jwt-${account.role}`, user }
    }
  }

  // 3. In production — call the real backend
  if (!import.meta.env.DEV) {
    const res = await api.post<EmailLoginResponse>('/auth/login', { email, password })
    return res.data
  }

  throw new Error('Invalid email or password')
}

export async function logoutEmail(): Promise<void> {
  setEmailToken(null)
  if (!import.meta.env.DEV) {
    await api.post('/auth/logout').catch(() => {})
  }
}
