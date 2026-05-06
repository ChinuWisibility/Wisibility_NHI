import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIsAuthenticated } from '@azure/msal-react'
import { useAuthStore } from '@/stores/authStore'
import { ROLE_HOME } from '@/config/routes'
import { Spinner } from '@/components/ui/Spinner'

// With Azure Entra ID + MSAL, MFA and Conditional Access are handled entirely on
// Microsoft's login portal during the redirect flow — there is no in-app MFA step.
// This page exists for deep-link compatibility and shows a redirect indicator.
export default function MFA() {
  const navigate        = useNavigate()
  const msalAuth        = useIsAuthenticated()
  const userRole        = useAuthStore((s) => s.userRole)

  useEffect(() => {
    if (msalAuth && userRole) {
      navigate(ROLE_HOME[userRole], { replace: true })
    } else if (!msalAuth) {
      navigate('/login', { replace: true })
    }
  }, [msalAuth, userRole, navigate])

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center gap-4">
      <h1 className="font-display text-2xl font-bold text-bright">
        NHI<span className="text-cyber-cyan">ALPS</span>
      </h1>
      <Spinner size="lg" />
      <p className="font-mono text-[10px] tracking-[2px] uppercase text-muted">
        Completing authentication…
      </p>
    </div>
  )
}
