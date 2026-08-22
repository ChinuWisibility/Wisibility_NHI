import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'
import { registerWithEmail } from '@/services/auth.service'
import { ROLE_HOME } from '@/config/routes'
import { Button } from '@/components/ui/Button'
import type { UserRole } from '@/types/user.types'
import { USER_ROLE_LABELS } from '@/types/user.types'
import {
  FingerPrintIcon, ShieldCheckIcon, LockClosedIcon, CheckBadgeIcon, EyeIcon, EyeSlashIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { cn } from '@/utils/cn'

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

const DEV_ROLES: UserRole[] = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5']

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'L0', label: 'L0 — Super Admin' },
  { value: 'L1', label: 'L1 — Program Manager' },
  { value: 'L2', label: 'L2 — Security Analyst' },
  { value: 'L3', label: 'L3 — Developer / DevOps' },
  { value: 'L4', label: 'L4 — Auditor / Compliance' },
  { value: 'L5', label: 'L5 — Read-Only Viewer' },
]

const FEATURES = [
  { icon: ShieldCheckIcon, label: 'Discover · Understand · Govern' },
  { icon: LockClosedIcon, label: 'Least Privilege & Vaulting' },
  { icon: CheckBadgeIcon, label: 'Certification & Audit' },
]

const clayInput =
  'w-full bg-white border-[1.5px] border-slate-300 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-500 placeholder:font-normal shadow-sm focus:outline-none focus:bg-white focus:border-brand focus:ring-2 focus:ring-blue-100 transition-all duration-200'

export default function Login() {
  const { emailLogin, isAuthenticated: isAuth, userRole } = useAuth()
  const { setUser, setToken } = useAuthStore()
  const navigate              = useNavigate()
  const location              = useLocation()

  const [view, setView]               = useState<'login' | 'register'>('login')
  const [loading, setLoading]         = useState(false)
  const [showPassword, setShowPassword]   = useState(false)
  const [showConfirm, setShowConfirm]     = useState(false)

  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) })
  const regForm   = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'L2' },
  })

  useEffect(() => {
    if (!isAuth || !userRole) return
    const from = location.state?.from
    const target = (from && from !== '/login' && from !== '/mfa') ? from : ROLE_HOME[userRole]
    if (location.pathname === target) return
    navigate(target, { replace: true })
  }, [isAuth, userRole, location.pathname, location.state, navigate])

  if (isAuth && userRole) return null

  const onLogin = async (data: LoginData) => {
    setLoading(true)
    try {
      const result = await emailLogin(data.email, data.password)
      const target = location.state?.from || ROLE_HOME[result.user.role]
      navigate(target, { replace: true })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const onRegister = async (data: RegisterData) => {
    setLoading(true)
    try {
      const result = await registerWithEmail(data.name, data.email, data.password, data.role)
      setToken(result.token)
      setUser(result.user)
      navigate(location.state?.from || ROLE_HOME[result.user.role], { replace: true })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not create account')
    } finally {
      setLoading(false)
    }
  }

  const devLogin = (role: UserRole) => {
    const token = `dev-jwt-${role}`
    setToken(token)
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

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #f8fafc 0%, #eef2ff 45%, #e0e7ff 100%)' }}>
      <div
        className="absolute -top-[60px] -left-[60px] w-[260px] h-[260px] pointer-events-none"
        style={{
          borderRadius: '60% 40% 70% 30% / 50% 60% 40% 50%',
          background: 'rgba(255,255,255,0.45)',
          boxShadow: 'inset 0 -8px 20px rgba(0,0,0,0.06), 0 20px 40px rgba(37,99,235,0.08)',
          animation: 'floatBlob1 6s ease-in-out infinite',
        }}
      />
      <div
        className="absolute -bottom-[80px] -right-[50px] w-[300px] h-[300px] pointer-events-none"
        style={{
          borderRadius: '40% 60% 30% 70% / 60% 40% 70% 30%',
          background: 'rgba(37,99,235,0.08)',
          animation: 'floatBlob2 8s ease-in-out infinite',
        }}
      />

      <div className="hidden md:flex flex-col items-center justify-center relative overflow-hidden px-12 py-12" style={{ flex: '0 0 58%' }}>
        <div className="absolute top-[40%] -right-[30px] w-40 h-40 pointer-events-none" style={{ borderRadius: '50% 50% 40% 60% / 40% 70% 30% 60%', background: 'rgba(59,130,246,0.18)', animation: 'floatBlob3 7s ease-in-out infinite' }} />

        <div className="flex items-center gap-3 mb-8 self-start z-10">
          <span
            className="w-[46px] h-[46px] rounded-[14px] flex items-center justify-center bg-gradient-to-br from-white to-indigo-50"
            style={{ boxShadow: '0 8px 0 rgba(30,58,138,0.35), 0 12px 20px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)' }}
          >
            <ShieldCheckIcon className="w-[22px] h-[22px] text-brand" />
          </span>
          <div>
            <p className="text-lg font-extrabold text-slate-900 leading-tight">Wisibility</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">NHI Compass</p>
          </div>
        </div>

        <div className="z-10 mb-8" style={{ animation: 'floatCard 5s ease-in-out infinite' }}>
          <div
            className="w-[220px] h-[220px] rounded-[28px] flex items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, #3b82f6, #2563EB)',
              boxShadow: '0 16px 0 rgba(30,58,138,0.28), 0 24px 40px rgba(37,99,235,0.28), inset 0 2px 0 rgba(255,255,255,0.3)',
            }}
          >
            <FingerPrintIcon className="w-24 h-24 text-white" />
          </div>
        </div>

        <div className="flex gap-3 flex-wrap justify-center z-10">
          {FEATURES.map((f) => (
            <span
              key={f.label}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl text-[11.5px] font-bold text-blue-900"
              style={{ boxShadow: '0 4px 0 rgba(30,58,138,0.25), 0 6px 12px rgba(0,0,0,0.1)' }}
            >
              <f.icon className="w-3.5 h-3.5 text-brand" />
              {f.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative min-h-screen">
        <div className="w-full max-w-[480px] relative z-10 bg-white rounded-[28px] border-[1.5px] border-slate-300 p-8 sm:p-10 max-h-[calc(100vh-48px)] overflow-y-auto" style={{ boxShadow: '0 16px 40px rgba(15,23,42,0.12)' }}>
          <div className="text-center mb-7">
            <span
              className="inline-flex items-center justify-center w-[58px] h-[58px] rounded-[18px] mb-3"
              style={{ background: 'linear-gradient(145deg, #3b82f6, #2563EB)', boxShadow: '0 8px 0 rgba(30,58,138,0.3), 0 12px 24px rgba(37,99,235,0.25), inset 0 2px 0 rgba(255,255,255,0.3)' }}
            >
              <FingerPrintIcon className="w-[30px] h-[30px] text-white" />
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">NHI Compass</h1>
          </div>

          <div className="mb-7">
            <h2 className="text-[1.35rem] font-black text-slate-900 tracking-tight leading-tight mb-1">
              {view === 'login' ? 'Welcome back 👋' : 'Create your account'}
            </h2>
            <p className="text-sm font-medium text-slate-500">
              {view === 'login' ? 'Sign in to discover, govern and secure every non-human identity' : 'Set up access to Wisibility NHI Compass'}
            </p>
          </div>

          <div className="flex mb-6 p-1 rounded-2xl bg-slate-100 border border-slate-300">
            {(['login', 'register'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'flex-1 py-2 text-sm font-bold rounded-xl transition-all',
                  view === v
                    ? 'bg-white text-brand shadow-[0_3px_0_rgba(37,99,235,0.18)]'
                    : 'text-slate-600 hover:text-slate-800',
                )}
              >
                {v === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {view === 'login' ? (
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Email address"
                  autoComplete="email"
                  className={clayInput}
                  {...loginForm.register('email')}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-xs font-medium text-red-600 mt-1">{loginForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  autoComplete="current-password"
                  className={cn(clayInput, 'pr-12')}
                  {...loginForm.register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-brand"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
                {loginForm.formState.errors.password && (
                  <p className="text-xs font-medium text-red-600 mt-1">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-2">
                {loading ? 'Signing in…' : 'Sign in →'}
              </Button>
              <p className="text-center text-sm font-medium text-slate-500 pt-1">
                No account?{' '}
                <button type="button" onClick={() => setView('register')} className="text-brand font-bold hover:underline">
                  Create one
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={regForm.handleSubmit(onRegister)} className="space-y-3.5">
              <input type="text" placeholder="Full name" autoComplete="name" className={clayInput} {...regForm.register('name')} />
              {regForm.formState.errors.name && <p className="text-xs font-medium text-red-600 -mt-2">{regForm.formState.errors.name.message}</p>}
              <input type="email" placeholder="Email address" autoComplete="email" className={clayInput} {...regForm.register('email')} />
              {regForm.formState.errors.email && <p className="text-xs font-medium text-red-600 -mt-2">{regForm.formState.errors.email.message}</p>}
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} placeholder="Password (min 6 characters)" autoComplete="new-password" className={cn(clayInput, 'pr-12')} {...regForm.register('password')} />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-brand" tabIndex={-1}>
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} placeholder="Confirm password" autoComplete="new-password" className={cn(clayInput, 'pr-12')} {...regForm.register('confirmPassword')} />
                <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-brand" tabIndex={-1}>
                  {showConfirm ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
                {regForm.formState.errors.confirmPassword && <p className="text-xs font-medium text-red-600 mt-1">{regForm.formState.errors.confirmPassword.message}</p>}
              </div>
              <select {...regForm.register('role')} className={clayInput}>
                {ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
                Create Account & Sign In
              </Button>
              <p className="text-center text-sm font-medium text-slate-500">
                Already have an account?{' '}
                <button type="button" onClick={() => setView('login')} className="text-brand font-bold hover:underline">
                  Sign in
                </button>
              </p>
            </form>
          )}

          {import.meta.env.DEV && (
            <div className="mt-6 pt-5 border-t border-slate-200">
              <p className="text-[11px] font-bold tracking-wide uppercase text-amber-600 mb-3">Dev · Quick Role Login</p>
              <div className="grid grid-cols-3 gap-2">
                {DEV_ROLES.map((role) => (
                  <button
                    key={role}
                    onClick={() => devLogin(role)}
                    className="flex flex-col items-start px-3 py-2 rounded-xl border border-slate-300 hover:border-brand hover:bg-blue-50 transition-colors text-left"
                  >
                    <span className="text-[11px] font-extrabold text-brand">{role}</span>
                    <span className="text-[10px] text-slate-600 leading-tight mt-0.5">{USER_ROLE_LABELS[role]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-center text-[11px] font-medium text-slate-500 mt-6 tracking-wide">
            © 2026 Wisibility · NHI Compass
          </p>
        </div>
      </div>
    </div>
  )
}
