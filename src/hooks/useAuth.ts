import { useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { loginWithEmail, logoutEmail } from '@/services/auth.service'

export function useAuth() {
  const { user, userRole, isAuthenticated, setUser, setToken, logout: storeLogout } = useAuthStore()

  const emailLogin = useCallback(async (email: string, password: string) => {
    const result = await loginWithEmail(email, password)
    setToken(result.token)
    setUser(result.user)
    return result
  }, [setUser, setToken])

  const logout = useCallback(async () => {
    await logoutEmail()
    storeLogout()
  }, [storeLogout])

  const login = useCallback(() => {
    // Legacy MSAL login placeholder
    console.warn('Azure SSO has been removed. Use email login instead.')
  }, [])

  return {
    user,
    userRole,
    isAuthenticated,
    login,
    emailLogin,
    logout,
    inProgress: 'none', // compatibility with legacy code
  }
}
