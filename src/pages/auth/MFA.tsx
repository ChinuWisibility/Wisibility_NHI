import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIsAuthenticated } from '@azure/msal-react'
import { useAuthStore } from '@/stores/authStore'
import { ROLE_HOME } from '@/config/routes'
import { Spinner } from '@/components/ui/Spinner'
import { FingerPrintIcon } from '@heroicons/react/24/outline'

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
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'linear-gradient(160deg, #f8fafc 0%, #eef2ff 45%, #e0e7ff 100%)' }}>
      <span
        className="w-14 h-14 rounded-[18px] flex items-center justify-center"
        style={{ background: 'linear-gradient(145deg, #3b82f6, #2563EB)', boxShadow: '0 8px 0 rgba(30,58,138,0.3), 0 12px 24px rgba(37,99,235,0.25)' }}
      >
        <FingerPrintIcon className="w-7 h-7 text-white" />
      </span>
      <h1 className="text-xl font-extrabold text-slate-900">NHI Compass</h1>
      <Spinner size="lg" />
      <p className="text-xs font-semibold tracking-wide uppercase text-slate-400">
        Completing authentication…
      </p>
    </div>
  )
}
