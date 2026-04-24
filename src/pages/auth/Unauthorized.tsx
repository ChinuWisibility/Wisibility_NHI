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
    <div className="min-h-screen bg-bg-dark flex items-center justify-center p-4">
      <div className="text-center">
        <ShieldExclamationIcon className="w-12 h-12 text-cyber-red mx-auto mb-4 opacity-80" />
        <p className="font-mono text-[10px] tracking-[3px] uppercase text-cyber-red mb-2">403 Forbidden</p>
        <h2 className="font-display text-2xl font-semibold text-[#e2eeff] mb-3">Access Denied</h2>
        <p className="text-sm text-[#5a7a9a] mb-6 max-w-xs mx-auto">
          Your role does not have permission to access this page.
        </p>
        <Button variant="primary" onClick={handleBack}>Return to Dashboard</Button>
      </div>
    </div>
  )
}
