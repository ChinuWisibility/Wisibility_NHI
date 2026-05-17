import axios from 'axios'
import { InteractionRequiredAuthError } from '@azure/msal-browser'
import { msalInstance, loginRequest } from '@/config/azure-config'
import { useAuthStore } from '@/stores/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
})

api.interceptors.request.use(async (config) => {
  try {
    if (msalInstance) {
      const accounts = msalInstance.getAllAccounts()
      if (accounts.length > 0) {
        // MSAL (Entra ID) — acquire token silently
        const result = await msalInstance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
        })
        config.headers.Authorization = `Bearer ${result.accessToken}`
        return config
      }
    }

    // Fallback: Email login JWT — read from Zustand store
    const token = useAuthStore.getState().sessionToken
    if (token) config.headers.Authorization = `Bearer ${token}`
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError && msalInstance) {
      msalInstance.loginRedirect(loginRequest)
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login')
    if (error.response?.status === 401 && !isLoginRequest) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default api
