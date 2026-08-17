import { Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Spinner } from '@/components/ui/Spinner'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { ROLE_LEVELS } from '@/types/user.types'
import { routes, ROLE_HOME, type RouteConfig } from '@/config/routes'
import type { UserRole } from '@/types/user.types'

function RouteGuard({ config }: { config: RouteConfig }) {
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const userRole = useAuthStore((s) => s.userRole)

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
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  return (
    <>
      <Routes>
        {/* Public Routes */}
        {routes.filter(r => r.isPublic).map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <Suspense fallback={<LoadingFallback />}>
                {route.element}
              </Suspense>
            }
          />
        ))}

        {/* Private Routes (Wrapped in AppShell) */}
        <Route element={<AppShell />}>
          {routes.filter(r => !r.isPublic).map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <RouteGuard config={route} />
                </Suspense>
              }
            />
          ))}
        </Route>

        {/* Root Redirect */}
        <Route
          path="/"
          element={<Navigate to={userRole ? ROLE_HOME[userRole] : '/login'} replace />}
        />

        {/* Catch-all Redirect */}
        <Route
          path="*"
          element={<Navigate to={userRole ? ROLE_HOME[userRole] : '/login'} replace />}
        />
      </Routes>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--color-surface)',
            color:      'var(--color-text-main)',
            border:     '1px solid var(--color-surface-border)',
            boxShadow:  '0 8px 24px rgba(15,23,42,0.12)',
            fontFamily: '"Plus Jakarta Sans", Inter, sans-serif',
            fontSize:   '13px',
            fontWeight: 600,
            borderRadius: '12px',
          },
        }}
      />
    </>
  )
}
