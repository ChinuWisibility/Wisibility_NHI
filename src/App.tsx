import { Suspense, useEffect, useContext } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useMsal, useIsAuthenticated, MsalContext } from '@azure/msal-react'
import { InteractionStatus } from '@azure/msal-browser'
import { AppShell } from '@/components/layout/AppShell'
import { Spinner } from '@/components/ui/Spinner'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { ROLE_LEVELS } from '@/types/user.types'
import { routes, ROLE_HOME, type RouteConfig } from '@/config/routes'
import type { UserRole } from '@/types/user.types'

function RouteGuard({ config }: { config: RouteConfig }) {
  const location = useLocation()
  
  // Check if we are inside an MSAL context
  const msalContext = useContext(MsalContext)
  const hasMsal = !!msalContext?.instance

  const { inProgress } = hasMsal 
    ? useMsal() 
    : { inProgress: InteractionStatus.None }
    
  const msalAuthenticated  = hasMsal ? useIsAuthenticated() : false
  const zustandAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const userRole = useAuthStore((s) => s.userRole)

  // While MSAL is handling the redirect promise, show a spinner rather than bouncing to /login
  if (inProgress !== InteractionStatus.None) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-dark">
        <Spinner size="lg" />
      </div>
    )
  }

  // Accept either MSAL auth (production) or Zustand-only auth (dev mode bypass)
  const isAuthenticated = msalAuthenticated || zustandAuthenticated

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (config.minRole && userRole) {
    const userLevel = ROLE_LEVELS[userRole]
    const reqLevel  = ROLE_LEVELS[config.minRole as UserRole]
    if (userLevel > reqLevel) {
      return <Navigate to="/403" replace />
    }
  }

  return <>{config.element}</>
}

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-bg-dark">
    <Spinner size="lg" />
  </div>
)

export default function App() {
  const userRole = useAuthStore((s) => s.userRole)
  const theme = useUIStore((s) => s.theme)

  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'light') {
      root.classList.add('light')
    } else {
      root.classList.remove('light')
    }
  }, [theme])

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {routes.map((route) => {
          if (route.isPublic) {
            return <Route key={route.path} path={route.path} element={route.element} />
          }
          return (
            <Route
              key={route.path}
              path={route.path}
              element={
                <AppShell>
                  <RouteGuard config={route} />
                </AppShell>
              }
            />
          )
        })}
        <Route
          path="/"
          element={<Navigate to={userRole ? ROLE_HOME[userRole] : '/login'} replace />}
        />
        <Route
          path="*"
          element={<Navigate to={userRole ? ROLE_HOME[userRole] : '/login'} replace />}
        />
      </Routes>
    </Suspense>
  )
}
