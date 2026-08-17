import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BellIcon, MagnifyingGlassIcon, Bars3Icon,
  SunIcon, MoonIcon, UserIcon, Cog6ToothIcon,
  ArrowRightOnRectangleIcon, ChevronDownIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore } from '@/stores/authStore'
import { useAlertStore } from '@/stores/alertStore'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/stores/uiStore'
import { USER_ROLE_LABELS } from '@/types/user.types'
import { cn } from '@/utils/cn'

export function TopNav() {
  const user        = useAuthStore((s) => s.user)
  const alertCount  = useAlertStore((s) => s.alertCount)
  const crumbs      = useUIStore((s) => s.breadcrumbs)
  const theme       = useUIStore((s) => s.theme)
  const toggleTheme = useUIStore((s) => s.toggleTheme)
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const { logout }  = useAuth()

  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const initials = user?.name
    ? user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : 'U'
  const roleLabel = user?.role ? USER_ROLE_LABELS[user.role] : 'User'

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-4 px-4 sm:px-6 bg-surface text-bright"
      style={{
        height: 63,
        borderBottom: '1.5px solid #cbd5e1',
        boxShadow: '0 1px 0 #e2e8f0, 0 4px 16px rgba(15,23,42,0.06)',
      }}
    >
      <button
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-slate-600 bg-white border-[1.5px] border-slate-300 hover:bg-blue-50 hover:text-brand hover:border-blue-400 hover:-translate-y-px transition-all"
      >
        <Bars3Icon className={cn('w-4 h-4 transition-transform', !sidebarOpen && 'scale-x-[-1]')} />
      </button>

      <div className="hidden sm:flex items-center flex-1 max-w-[460px] px-3 py-1.5 rounded-[14px] bg-slate-50 border-[1.5px] border-slate-300 focus-within:bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-blue-100 transition-all">
        <MagnifyingGlassIcon className="w-[18px] h-[18px] text-slate-500 mr-2 shrink-0" />
        <input
          placeholder="Search identities, applications, roles..."
          className="flex-1 bg-transparent border-0 p-0 text-[13.5px] font-medium text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-0"
        />
        <span className="px-1.5 py-0.5 rounded-md bg-white border border-slate-300 text-[10px] font-bold text-slate-600">
          ⌘K
        </span>
      </div>

      {crumbs.length > 0 && (
        <nav className="hidden lg:flex items-center gap-2 text-[12px] font-semibold text-slate-500">
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-slate-400">/</span>}
              <span className={i === crumbs.length - 1 ? 'text-slate-800' : ''}>{crumb.label}</span>
            </span>
          ))}
        </nav>
      )}

      <div className="flex-1" />

      <button
        onClick={toggleTheme}
        className="w-[38px] h-[38px] rounded-xl flex items-center justify-center text-slate-600 bg-white border-[1.5px] border-slate-300 hover:bg-blue-50 hover:text-brand hover:border-blue-400 hover:-translate-y-px transition-all"
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
      </button>

      <div className="relative" ref={notifRef}>
        <button
          onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false) }}
          className="relative w-[38px] h-[38px] rounded-xl flex items-center justify-center text-slate-600 bg-white border-[1.5px] border-slate-300 hover:bg-blue-50 hover:text-brand hover:border-blue-400 hover:-translate-y-px transition-all"
        >
          <BellIcon className="w-4 h-4" />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-[15px] text-center">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 mt-3 w-80 bg-white rounded-[20px] border-[1.5px] border-slate-300 shadow-[0_12px_40px_rgba(15,23,42,0.16)] overflow-hidden z-50">
            <div className="px-5 py-4 flex items-center justify-between bg-slate-50 border-b border-slate-200">
              <p className="font-extrabold text-slate-900 text-sm">Notifications</p>
              <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-[10px] font-extrabold text-blue-800">
                {alertCount} new
              </span>
            </div>
            <div className="px-5 py-8 text-center text-sm text-slate-600 font-medium">
              {alertCount > 0 ? `${alertCount} alerts in the monitoring queue.` : 'You are all caught up.'}
            </div>
            <div className="p-3 text-center border-t border-slate-200">
              <Link to="/monitoring/alerts" onClick={() => setNotifOpen(false)} className="text-xs font-bold text-brand hover:underline">
                View all notifications →
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="relative" ref={profileRef}>
        <button
          onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false) }}
          className={cn(
            'flex items-center gap-2 px-2 py-1 rounded-[14px] cursor-pointer transition-all border-[1.5px]',
            profileOpen
              ? 'bg-blue-50 border-blue-300 shadow-sm'
              : 'bg-white border-slate-300 hover:bg-blue-50 hover:border-blue-400 hover:-translate-y-px',
          )}
        >
          <span
            className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[12px] font-extrabold text-white border-2 border-white/80"
            style={{ background: 'linear-gradient(145deg, #3b82f6cc, #2563EB)', boxShadow: '0 3px 0 #2563EB55, 0 4px 10px #2563EB40' }}
          >
            {initials}
          </span>
          <span className="hidden md:block text-left leading-tight">
            <span className="block text-[13px] font-bold text-slate-900 leading-tight">{user?.name ?? 'User'}</span>
            <span className="block text-[10px] font-bold tracking-wide text-brand">{roleLabel}</span>
          </span>
          <ChevronDownIcon className={cn('w-4 h-4 text-slate-500 transition-transform', profileOpen && 'rotate-180')} />
        </button>

        {profileOpen && (
          <div className="absolute right-0 mt-3 w-[280px] bg-white rounded-[20px] border-[1.5px] border-slate-300 shadow-[0_12px_40px_rgba(15,23,42,0.16)] overflow-hidden z-50">
            <div className="px-5 pt-5 pb-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-extrabold text-white border-[3px] border-white"
                  style={{ background: 'linear-gradient(145deg, #3b82f6, #2563EB)', boxShadow: '0 6px 0 rgba(30,58,138,0.3), 0 8px 20px rgba(37,99,235,0.25)' }}
                >
                  {initials}
                </span>
                <div className="min-w-0">
                  <p className="font-extrabold text-slate-900 text-[15px] leading-tight truncate">{user?.name ?? 'User'}</p>
                  <p className="text-xs text-slate-600 font-medium truncate">{user?.email ?? ''}</p>
                </div>
              </div>
              <span className="inline-flex items-center px-2 py-1 rounded-[9px] bg-blue-50 border border-blue-200 text-[10px] font-extrabold tracking-wider text-blue-800">
                {roleLabel.toUpperCase()}
              </span>
            </div>

            <div className="p-3 space-y-0.5">
              <Link
                to="/admin/users"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors"
              >
                <span className="w-[34px] h-[34px] rounded-[10px] bg-blue-50 border-[1.5px] border-blue-200 flex items-center justify-center text-brand">
                  <UserIcon className="w-4 h-4" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-slate-900 leading-tight">View Profile</span>
                  <span className="block text-xs text-slate-600 font-medium">Manage your account</span>
                </span>
              </Link>
              <Link
                to="/admin/config"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors"
              >
                <span className="w-[34px] h-[34px] rounded-[10px] bg-blue-50 border-[1.5px] border-blue-200 flex items-center justify-center text-brand">
                  <Cog6ToothIcon className="w-4 h-4" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-slate-900 leading-tight">Settings</span>
                  <span className="block text-xs text-slate-600 font-medium">Preferences & security</span>
                </span>
              </Link>
            </div>

            <div className="px-3 pb-3 pt-2 border-t border-slate-200">
              <button
                onClick={() => { setProfileOpen(false); logout() }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors text-left"
              >
                <span className="w-[34px] h-[34px] rounded-[10px] bg-red-50 border-[1.5px] border-red-500/20 shadow-[0_3px_0_rgba(220,38,38,0.15)] flex items-center justify-center">
                  <ArrowRightOnRectangleIcon className="w-4 h-4 text-red-600" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-red-600 leading-tight">Sign out</span>
                  <span className="block text-xs text-red-500 font-medium">End your session</span>
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
