import axios from 'axios'
import { InteractionRequiredAuthError } from '@azure/msal-browser'
import { msalInstance, loginRequest } from '@/config/azure-config'
import { getEmailToken } from '@/services/auth.service'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(async (config) => {
  try {
    const accounts = msalInstance.getAllAccounts()
    if (accounts.length > 0) {
      // MSAL (Entra ID) — acquire token silently
      const result = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      })
      config.headers.Authorization = `Bearer ${result.accessToken}`
    } else {
      // Email login JWT fallback
      const token = getEmailToken()
      if (token) config.headers.Authorization = `Bearer ${token}`
    }
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      msalInstance.loginRedirect(loginRequest)
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default api
