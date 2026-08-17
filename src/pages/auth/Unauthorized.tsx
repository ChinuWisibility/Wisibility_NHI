import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ROLE_HOME } from '@/config/routes'
import { Button } from '@/components/ui/Button'
import { ShieldExclamationIcon } from '@heroicons/react/24/outline'

export default function Unauthorized() {
  const navigate     = useNavigate()
  const { userRole } = useAuth()

  const handleBack = () => {
    const dest = userRole ? ROLE_HOME[userRole] : '/login'
    navigate(dest)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(160deg, #f8fafc 0%, #eef2ff 45%, #e0e7ff 100%)' }}>
      <div className="text-center bg-white rounded-[28px] border-[1.5px] border-slate-300 p-10 max-w-md" style={{ boxShadow: '0 16px 40px rgba(15,23,42,0.12)' }}>
        <ShieldExclamationIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-xs font-bold tracking-wide uppercase text-red-500 mb-2">403 Forbidden</p>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">Access Denied</h2>
        <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto font-medium">
          Your role does not have permission to access this page.
        </p>
        <Button variant="primary" onClick={handleBack}>Return to Dashboard</Button>
      </div>
    </div>
  )
}
