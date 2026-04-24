import { BellIcon, UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '@/stores/authStore'
import { useAlertStore } from '@/stores/alertStore'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/stores/uiStore'
import { USER_ROLE_LABELS } from '@/types/user.types'
import { cn } from '@/utils/cn'

export function TopNav() {
  const user       = useAuthStore((s) => s.user)
  const alertCount = useAlertStore((s) => s.alertCount)
  const hasUnread  = useAlertStore((s) => s.hasUnread)
  const markRead   = useAlertStore((s) => s.markRead)
  const crumbs     = useUIStore((s) => s.breadcrumbs)
  const { logout } = useAuth()

  return (
    <header className="h-14 bg-surface border-b border-surface-border flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 font-mono text-[11px] text-[#5a7a9a]">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span>/</span>}
            <span className={i === crumbs.length - 1 ? 'text-[#b8cfe6]' : ''}>{crumb.label}</span>
          </span>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Alert bell */}
        <button
          onClick={markRead}
          className="relative p-2 rounded text-[#5a7a9a] hover:text-cyber-cyan hover:bg-cyber-cyan/8 transition-colors"
        >
          <BellIcon className="w-4 h-4" />
          {alertCount > 0 && (
            <span
              className={cn(
                'absolute top-1 right-1 w-2 h-2 rounded-full bg-cyber-red',
                hasUnread && 'animate-pulse-slow',
              )}
            />
          )}
        </button>

        {/* User info */}
        <div className="flex items-center gap-2 pl-3 border-l border-surface-border">
          <UserCircleIcon className="w-5 h-5 text-[#5a7a9a]" />
          <div className="hidden md:block">
            <p className="text-[11px] text-[#e2eeff] font-medium leading-none mb-0.5">{user?.name ?? '—'}</p>
            <p className="font-mono text-[9px] text-cyber-cyan tracking-wide">
              {user?.role ? USER_ROLE_LABELS[user.role] : '—'}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="p-2 rounded text-[#5a7a9a] hover:text-cyber-red hover:bg-cyber-red/8 transition-colors"
          title="Sign out"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
