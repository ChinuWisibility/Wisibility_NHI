import api from '@/config/axiosInstance'
import type { User, UserRole } from '@/types/user.types'

export interface EmailLoginResponse {
  token: string
  user: User
}

// Lightweight module-level store so non-React code (axios interceptor) can read the JWT
let _emailToken: string | null = null
export const setEmailToken = (token: string | null) => { _emailToken = token }
export const getEmailToken = () => _emailToken

// Dev-only test credentials — works without Azure or a real backend
const DEV_ACCOUNTS: Record<string, { password: string; role: UserRole; name: string }> = {
  'admin@nhi.local':    { password: 'Admin@123',   role: 'L0', name: 'Super Admin' },
  'manager@nhi.local':  { password: 'Manager@123', role: 'L1', name: 'Program Manager' },
  'analyst@nhi.local':  { password: 'Analyst@123', role: 'L2', name: 'Security Analyst' },
  'developer@nhi.local':{ password: 'Dev@123',     role: 'L3', name: 'Developer' },
  'auditor@nhi.local':  { password: 'Audit@123',   role: 'L4', name: 'Auditor' },
  'viewer@nhi.local':   { password: 'View@123',    role: 'L5', name: 'Viewer' },
}

export async function loginWithEmail(email: string, password: string): Promise<EmailLoginResponse> {
  if (import.meta.env.DEV) {
    const account = DEV_ACCOUNTS[email.toLowerCase().trim()]
    if (!account || account.password !== password) {
      throw new Error('Invalid email or password')
    }
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

  // Production: APIM → nhi-auth-middleware → returns signed JWT + user profile
  const res = await api.post<EmailLoginResponse>('/auth/login', { email, password })
  return res.data
}

export async function logoutEmail(): Promise<void> {
  setEmailToken(null)
  if (!import.meta.env.DEV) {
    await api.post('/auth/logout').catch(() => {})
  }
}
