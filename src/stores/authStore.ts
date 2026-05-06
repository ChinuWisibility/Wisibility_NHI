import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, UserRole } from '@/types/user.types'

interface AuthState {
  user:            User | null
  userRole:        UserRole | null
  sessionToken:    string | null
  isAuthenticated: boolean
  setUser:         (user: User) => void
  setToken:        (token: string) => void
  logout:          () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:            null,
      userRole:        null,
      sessionToken:    null,
      isAuthenticated: false,

      setUser: (user) =>
        set({ user, userRole: user.role, isAuthenticated: true }),

      setToken: (token) =>
        set({ sessionToken: token }),

      logout: () =>
        set({ user: null, userRole: null, sessionToken: null, isAuthenticated: false }),
    }),
    {
      name:    'nhi-auth',
      partialize: (state) => ({
        user:            state.user,
        userRole:        state.userRole,
        sessionToken:    state.sessionToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
