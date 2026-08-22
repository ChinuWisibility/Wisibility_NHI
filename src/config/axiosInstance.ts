import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
})

const OPTIONAL_GETS = ['/nhi/summary']

let handling401 = false

useAuthStore.subscribe((state, prev) => {
  if (state.sessionToken && state.sessionToken !== prev.sessionToken) {
    handling401 = false
  }
})

api.interceptors.request.use(async (config) => {
  const token = useAuthStore.getState().sessionToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = String(error.config?.url ?? '')
    const isAuthRequest = url.includes('/auth/login') || url.includes('/auth/register')
    const isOptionalGet = OPTIONAL_GETS.some((path) => url.includes(path))
    const alreadyOnLogin = window.location.pathname === '/login'

    if (
      error.response?.status === 401
      && !isAuthRequest
      && !isOptionalGet
      && !handling401
      && !alreadyOnLogin
    ) {
      handling401 = true
      useAuthStore.getState().logout()
    }

    return Promise.reject(error)
  },
)

export default api
