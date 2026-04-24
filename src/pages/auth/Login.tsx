import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useIsAuthenticated } from '@azure/msal-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'
import { ROLE_HOME } from '@/config/routes'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { UserRole } from '@/types/user.types'
import { USER_ROLE_LABELS } from '@/types/user.types'
import toast from 'react-hot-toast'

const schema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(1, 'Required'),
})
type FormData = z.infer<typeof schema>

const DEV_ROLES: UserRole[] = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5']

const DEV_CREDENTIALS = [
  { email: 'admin@nhi.local',     password: 'Admin@123',   role: 'L0' },
  { email: 'manager@nhi.local',   password: 'Manager@123', role: 'L1' },
  { email: 'analyst@nhi.local',   password: 'Analyst@123', role: 'L2' },
  { email: 'developer@nhi.local', password: 'Dev@123',     role: 'L3' },
  { email: 'auditor@nhi.local',   password: 'Audit@123',   role: 'L4' },
  { email: 'viewer@nhi.local',    password: 'View@123',    role: 'L5' },
]

export default function Login() {
  const { login, emailLogin } = useAuth()
  const setUser               = useAuthStore((s) => s.setUser)
  const navigate              = useNavigate()
  const location              = useLocation()
  const [msalLoading, setMsalLoading]   = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const msalAuthenticated = useIsAuthenticated()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  if (msalAuthenticated) {
    const dest = location.state?.from || '/security/dashboard'
    navigate(dest, { replace: true })
    return null
  }

  const handleMsalLogin = () => {
    setMsalLoading(true)
    try {
      login()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed')
      setMsalLoading(false)
    }
  }

  const onEmailSubmit = async (data: FormData) => {
    setEmailLoading(true)
    try {
      const result = await emailLogin(data.email, data.password)
      const dest = location.state?.from || ROLE_HOME[result.user.role]
      navigate(dest, { replace: true })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Invalid email or password')
    } finally {
      setEmailLoading(false)
    }
  }

  const devLogin = (role: UserRole) => {
    setUser({
      userId:     `dev-${role}`,
      email:      `dev-${role.toLowerCase()}@nhi.local`,
      name:       `Dev ${USER_ROLE_LABELS[role]}`,
      role,
      mfaEnabled: false,
      createdAt:  new Date().toISOString(),
    })
    navigate(ROLE_HOME[role], { replace: true })
  }

  const fillDevCredential = (email: string, password: string) => {
    setValue('email', email)
    setValue('password', password)
  }

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,200,240,0.012)_2px,rgba(0,200,240,0.012)_4px)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="font-mono text-[9px] tracking-[4px] text-cyber-cyan opacity-70 uppercase mb-3">
            Non-Human Identity
          </p>
          <h1 className="font-display text-3xl font-bold text-[#e2eeff] tracking-tight">
            NHI<span className="text-cyber-cyan">ALPS</span>
          </h1>
          <p className="text-xs text-[#5a7a9a] mt-2">Governance Platform · Secure Access</p>
        </div>

        {/* Main card */}
        <div className="bg-surface border border-surface-border rounded-lg p-8 shadow-2xl space-y-6">

          {/* Microsoft SSO */}
          <div>
            <p className="font-mono text-[10px] tracking-[2px] uppercase text-[#5a7a9a] mb-4">
              Enterprise SSO
            </p>
            <Button
              type="button"
              variant="primary"
              size="lg"
              loading={msalLoading}
              onClick={handleMsalLogin}
              className="w-full flex items-center justify-center gap-3"
            >
              <svg width="16" height="16" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="1"  y="1"  width="9" height="9" fill="#F25022"/>
                <rect x="11" y="1"  width="9" height="9" fill="#7FBA00"/>
                <rect x="1"  y="11" width="9" height="9" fill="#00A4EF"/>
                <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
              </svg>
              Sign in with Microsoft
            </Button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-surface-border" />
            <span className="font-mono text-[10px] text-[#5a7a9a] uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-surface-border" />
          </div>

          {/* Email / password */}
          <div>
            <p className="font-mono text-[10px] tracking-[2px] uppercase text-[#5a7a9a] mb-4">
              Sign in with Email
            </p>
            <form onSubmit={handleSubmit(onEmailSubmit)} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email')}
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  error={errors.password?.message}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-[34px] text-[#5a7a9a] hover:text-cyber-cyan transition-colors font-mono text-[10px]"
                  tabIndex={-1}
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>

              <Button
                type="submit"
                variant="secondary"
                size="lg"
                loading={emailLoading}
                className="w-full"
              >
                Sign In
              </Button>
            </form>
          </div>
        </div>

        {/* Dev test credentials — shown in DEV only */}
        {import.meta.env.DEV && (
          <div className="mt-4 space-y-3">
            {/* Quick role bypass */}
            <div className="bg-surface border border-cyber-amber/30 rounded-lg p-4">
              <p className="font-mono text-[9px] tracking-[2px] uppercase text-cyber-amber mb-3">
                Dev · Quick Role Login
              </p>
              <div className="grid grid-cols-3 gap-2">
                {DEV_ROLES.map((role) => (
                  <button
                    key={role}
                    onClick={() => devLogin(role)}
                    className="flex flex-col items-start px-3 py-2 rounded border border-surface-border hover:border-cyber-cyan/50 hover:bg-cyber-cyan/5 transition-colors text-left"
                  >
                    <span className="font-mono text-[10px] text-cyber-cyan">{role}</span>
                    <span className="text-[10px] text-[#5a7a9a] leading-tight mt-0.5">
                      {USER_ROLE_LABELS[role]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Test credentials — click to fill the form */}
            <div className="bg-surface border border-surface-border rounded-lg p-4">
              <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#5a7a9a] mb-3">
                Dev · Test Credentials (click to fill)
              </p>
              <div className="space-y-1">
                {DEV_CREDENTIALS.map((c) => (
                  <button
                    key={c.role}
                    type="button"
                    onClick={() => fillDevCredential(c.email, c.password)}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded hover:bg-cyber-cyan/5 transition-colors text-left group"
                  >
                    <span className="font-mono text-[11px] text-cyber-cyan group-hover:text-cyber-cyan">{c.email}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-[#5a7a9a]">{c.password}</span>
                      <span className="font-mono text-[9px] text-[#5a7a9a] border border-surface-border px-1.5 py-0.5 rounded">{c.role}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <p className="text-center font-mono text-[9px] text-[#5a7a9a] mt-6">
          © 2025 NHI Governance Platform · CONFIDENTIAL
        </p>
      </div>
    </div>
  )
}
