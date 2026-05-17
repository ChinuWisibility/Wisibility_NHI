import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'
import { createLocalUser } from '@/services/localUsers.service'
import { ROLE_HOME } from '@/config/routes'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { UserRole } from '@/types/user.types'
import { USER_ROLE_LABELS } from '@/types/user.types'
import toast from 'react-hot-toast'

// ── Schemas ────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(1, 'Required'),
})

const registerSchema = z.object({
  name:            z.string().min(2, 'Min 2 characters'),
  email:           z.string().email('Invalid email'),
  password:        z.string().min(6, 'Min 6 characters'),
  confirmPassword: z.string().min(1, 'Required'),
  role:            z.enum(['L0', 'L1', 'L2', 'L3', 'L4', 'L5']),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type LoginData    = z.infer<typeof loginSchema>
type RegisterData = z.infer<typeof registerSchema>

// ── Dev helpers ────────────────────────────────────────────────────────────
const DEV_ROLES: UserRole[] = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5']

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'L0', label: 'L0 — Super Admin' },
  { value: 'L1', label: 'L1 — Program Manager' },
  { value: 'L2', label: 'L2 — Security Analyst' },
  { value: 'L3', label: 'L3 — Developer / DevOps' },
  { value: 'L4', label: 'L4 — Auditor / Compliance' },
  { value: 'L5', label: 'L5 — Read-Only Viewer' },
]

export default function Login() {
  const { login, emailLogin, isAuthenticated: isAuth, userRole } = useAuth()
  const { setUser, setToken } = useAuthStore()
  const navigate              = useNavigate()
  const location              = useLocation()

  const [view, setView]               = useState<'login' | 'register'>('login')
  const [msalLoading, setMsalLoading] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [showPassword, setShowPassword]   = useState(false)
  const [showConfirm, setShowConfirm]     = useState(false)

  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) })
  const regForm   = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'L2' },
  })

  // Auto-redirect if already logged in
  if (isAuth && userRole) {
    const from = location.state?.from || ROLE_HOME[userRole]
    console.log(`[Login] Already authenticated as ${userRole}, redirecting to ${from}`)
    navigate(from, { replace: true })
    return null
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleMsalLogin = () => {
    setMsalLoading(true)
    try { login() } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed')
      setMsalLoading(false)
    }
  }

  const onLogin = async (data: LoginData) => {
    setLoading(true)
    console.log(`[Login] Attempting login for ${data.email}...`)
    try {
      const result = await emailLogin(data.email, data.password)
      console.log(`[Login] Success! User role: ${result.user.role}`)
      const target = location.state?.from || ROLE_HOME[result.user.role]
      console.log(`[Login] Navigating to ${target}`)
      navigate(target, { replace: true })
    } catch (err: unknown) {
      console.error('[Login] Error:', err)
      toast.error(err instanceof Error ? err.message : 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const onRegister = async (data: RegisterData) => {
    setLoading(true)
    try {
      await createLocalUser(data.name, data.email, data.password, data.role)
      toast.success('Account created! Signing you in…')
      const result = await emailLogin(data.email, data.password)
      navigate(location.state?.from || ROLE_HOME[result.user.role], { replace: true })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not create account')
    } finally {
      setLoading(false)
    }
  }

  const devLogin = (role: UserRole) => {
    const token = `dev-jwt-${role}`
    setToken(token) // Make sure to use setToken from useAuthStore
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

  // ── Shared layout wrapper ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,200,240,0.012)_2px,rgba(0,200,240,0.012)_4px)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="font-mono text-[9px] tracking-[4px] text-cyber-cyan opacity-70 uppercase mb-3">
            Non-Human Identity
          </p>
          <h1 className="font-display text-3xl font-bold text-bright tracking-tight">
            NHI<span className="text-cyber-cyan">ALPS</span>
          </h1>
          <p className="text-xs text-muted mt-2">Governance Platform · Secure Access</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-surface-border rounded-lg shadow-2xl overflow-hidden">

          {/* Tab switcher */}
          <div className="flex border-b border-surface-border">
            {(['login', 'register'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex-1 py-3 font-mono text-[10px] tracking-[2px] uppercase transition-colors ${
                  view === v
                    ? 'text-cyber-cyan border-b-2 border-cyber-cyan bg-cyber-cyan/5'
                    : 'text-muted hover:text-main'
                }`}
              >
                {v === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <div className="p-8 space-y-6">
            {view === 'login' ? (
              <>
                {/* Microsoft SSO */}
                <div>
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    loading={msalLoading}
                    onClick={handleMsalLogin}
                    className="w-full flex items-center justify-center gap-3"
                  >
                    <svg width="16" height="16" viewBox="0 0 21 21" fill="none" aria-hidden="true">
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
                  <span className="font-mono text-[10px] text-muted uppercase tracking-widest">or</span>
                  <div className="flex-1 h-px bg-surface-border" />
                </div>

                {/* Email sign-in */}
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    error={loginForm.formState.errors.email?.message}
                    {...loginForm.register('email')}
                  />
                  <div className="relative">
                    <Input
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      error={loginForm.formState.errors.password?.message}
                      {...loginForm.register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-[34px] font-mono text-[10px] text-muted hover:text-cyber-cyan transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? 'HIDE' : 'SHOW'}
                    </button>
                  </div>
                  <Button type="submit" variant="secondary" size="lg" loading={loading} className="w-full">
                    Sign In
                  </Button>
                </form>

                <p className="text-center text-xs text-muted">
                  No account?{' '}
                  <button
                    type="button"
                    onClick={() => setView('register')}
                    className="text-cyber-cyan hover:underline"
                  >
                    Create one
                  </button>
                </p>
              </>
            ) : (
              <>
                {/* Create account form */}
                <form onSubmit={regForm.handleSubmit(onRegister)} className="space-y-4">
                  <Input
                    label="Full Name"
                    type="text"
                    placeholder="Your name"
                    autoComplete="name"
                    error={regForm.formState.errors.name?.message}
                    {...regForm.register('name')}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    error={regForm.formState.errors.email?.message}
                    {...regForm.register('email')}
                  />
                  <div className="relative">
                    <Input
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 6 characters"
                      autoComplete="new-password"
                      error={regForm.formState.errors.password?.message}
                      {...regForm.register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-[34px] font-mono text-[10px] text-muted hover:text-cyber-cyan transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? 'HIDE' : 'SHOW'}
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      label="Confirm Password"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                      error={regForm.formState.errors.confirmPassword?.message}
                      {...regForm.register('confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-[34px] font-mono text-[10px] text-muted hover:text-cyber-cyan transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirm ? 'HIDE' : 'SHOW'}
                    </button>
                  </div>

                  {/* Role selector */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10px] tracking-[1px] uppercase text-muted">
                      Role
                    </label>
                    <select
                      {...regForm.register('role')}
                      className="w-full bg-surface-2 border border-surface-border rounded px-3 py-2.5 text-sm text-main focus:outline-none focus:border-cyber-cyan/60 transition-colors"
                    >
                      {ROLE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    {regForm.formState.errors.role && (
                      <p className="text-xs text-cyber-red">{regForm.formState.errors.role.message}</p>
                    )}
                  </div>

                  <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
                    Create Account & Sign In
                  </Button>
                </form>

                <p className="text-center text-xs text-muted">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="text-cyber-cyan hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </>
            )}
          </div>
        </div>

        {/* Dev quick-login — only in development */}
        {import.meta.env.DEV && (
          <div className="mt-4 bg-surface border border-cyber-amber/30 rounded-lg p-4">
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
                  <span className="text-[10px] text-muted leading-tight mt-0.5">
                    {USER_ROLE_LABELS[role]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-center font-mono text-[9px] text-muted mt-6">
          © 2025 NHI Governance Platform · CONFIDENTIAL
        </p>
      </div>
    </div>
  )
}
