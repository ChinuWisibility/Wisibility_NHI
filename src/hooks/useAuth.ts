import { useEffect, useCallback } from 'react'
import { useMsal, useIsAuthenticated } from '@azure/msal-react'
import { InteractionStatus } from '@azure/msal-browser'
import { useAuthStore } from '@/stores/authStore'
import { loginRequest } from '@/config/azure-config'
import { loginWithEmail, logoutEmail } from '@/services/auth.service'
import type { User, UserRole } from '@/types/user.types'

const VALID_ROLES: UserRole[] = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5']

function extractRole(claims: Record<string, unknown> | undefined): UserRole {
  const roles = claims?.roles as string[] | undefined
  if (!roles?.length) return 'L5'
  const prefix = roles[0].split('.')[0]
  return VALID_ROLES.includes(prefix as UserRole) ? (prefix as UserRole) : 'L5'
}

export function useAuth() {
  const { instance, accounts, inProgress } = useMsal()
  const msalAuthenticated = useIsAuthenticated()
  const { user, userRole, isAuthenticated, sessionToken, setUser, setToken, logout: storeLogout } = useAuthStore()

  const account = accounts[0] ?? null

  // Sync MSAL account → Zustand store once MSAL has settled
  useEffect(() => {
    if (inProgress !== InteractionStatus.None) return

    if (msalAuthenticated && account && !user) {
      const claims = account.idTokenClaims as Record<string, unknown> | undefined
      setUser({
        userId:     account.localAccountId,
        email:      account.username,
        name:       account.name ?? account.username,
        role:       extractRole(claims),
        mfaEnabled: true,
        createdAt:  new Date().toISOString(),
      } satisfies User)
    }

    // Only auto-logout if both MSAL and local session are missing
    if (!msalAuthenticated && !account && isAuthenticated && !sessionToken && !import.meta.env.DEV) {
      storeLogout()
    }
  }, [msalAuthenticated, account, inProgress, user, isAuthenticated, sessionToken, setUser, setToken, storeLogout])

  const login = useCallback(() => {
    instance.loginRedirect(loginRequest)
  }, [instance])

  const emailLogin = useCallback(async (email: string, password: string) => {
    const result = await loginWithEmail(email, password)
    setToken(result.token)
    setUser(result.user)
    return result
  }, [setUser, setToken])

  const logout = useCallback(async () => {
    await logoutEmail()
    storeLogout()
    if (msalAuthenticated) {
      instance.logoutRedirect({ postLogoutRedirectUri: '/' })
    }
  }, [instance, msalAuthenticated, storeLogout])

  return {
    user,
    userRole,
    isAuthenticated: msalAuthenticated || isAuthenticated,
    inProgress,
    login,
    emailLogin,
    logout,
  }
}
