import { NavLink } from 'react-router-dom'
import {
  Squares2X2Icon, ShieldCheckIcon, MagnifyingGlassIcon,
  ExclamationTriangleIcon, LockClosedIcon, BellAlertIcon,
  ClipboardDocumentCheckIcon, UsersIcon, Cog6ToothIcon,
  DocumentMagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { useRBAC } from '@/hooks/useRBAC'
import { useAuthStore } from '@/stores/authStore'
import { ROLE_HOME } from '@/config/routes'
import { useAlertStore } from '@/stores/alertStore'
import type { UserRole } from '@/types/user.types'
import { cn } from '@/utils/cn'

interface NavSection {
  label:  string
  items:  NavItem[]
}

interface NavItem {
  label:   string
  href:    string
  icon:    typeof Squares2X2Icon
  minRole: UserRole
  badge?:  number
}

function useNavSections(alertCount: number): NavSection[] {
  return [
    {
      label: 'Dashboards',
      items: [
        { label: 'Admin',    href: '/admin/dashboard',    icon: Cog6ToothIcon,               minRole: 'L0' },
        { label: 'Program',  href: '/program/dashboard',  icon: Squares2X2Icon,              minRole: 'L1' },
        { label: 'Security', href: '/security/dashboard', icon: ShieldCheckIcon,             minRole: 'L2' },
        { label: 'Dev Portal', href: '/dev/dashboard',    icon: DocumentMagnifyingGlassIcon, minRole: 'L3' },
        { label: 'Audit',    href: '/audit/dashboard',    icon: ClipboardDocumentCheckIcon,  minRole: 'L4' },
        { label: 'Viewer',   href: '/view/dashboard',     icon: Squares2X2Icon,              minRole: 'L5' },
      ],
    },
    {
      label: 'Inventory',
      items: [
        { label: 'NHI Inventory',  href: '/inventory',         icon: MagnifyingGlassIcon, minRole: 'L2' },
        { label: 'Request NHI',    href: '/dev/request',       icon: DocumentMagnifyingGlassIcon, minRole: 'L3' },
      ],
    },
    {
      label: 'Discovery',
      items: [
        { label: 'Connectors',       href: '/discovery/connectors', icon: Cog6ToothIcon,           minRole: 'L0' },
        { label: 'Discovery Runs',   href: '/discovery/runs',       icon: MagnifyingGlassIcon,     minRole: 'L2' },
      ],
    },
    {
      label: 'Posture',
      items: [
        { label: 'Posture Dashboard', href: '/posture',        icon: ShieldCheckIcon,          minRole: 'L2' },
        { label: 'Issues',            href: '/posture/issues', icon: ExclamationTriangleIcon,  minRole: 'L2' },
      ],
    },
    {
      label: 'Security',
      items: [
        { label: 'Vault Management', href: '/security/vaults',    icon: LockClosedIcon,    minRole: 'L0' },
        { label: 'Rotation Center',  href: '/security/rotation',  icon: ShieldCheckIcon,   minRole: 'L2' },
      ],
    },
    {
      label: 'Monitoring',
      items: [
        { label: 'ITDR',       href: '/monitoring/itdr',   icon: ShieldCheckIcon,          minRole: 'L2' },
        { label: 'Alerts',     href: '/monitoring/alerts', icon: BellAlertIcon,            minRole: 'L2', badge: alertCount },
      ],
    },
    {
      label: 'Compliance',
      items: [
        { label: 'Control Mapping',   href: '/compliance/mapping',    icon: ClipboardDocumentCheckIcon, minRole: 'L4' },
        { label: 'Certifications',    href: '/compliance/campaigns',  icon: ClipboardDocumentCheckIcon, minRole: 'L1' },
        { label: 'Export Center',     href: '/compliance/export',     icon: DocumentMagnifyingGlassIcon, minRole: 'L4' },
      ],
    },
    {
      label: 'Admin',
      items: [
        { label: 'Users',      href: '/admin/users',  icon: UsersIcon,  minRole: 'L0' },
        { label: 'Audit Log',  href: '/admin/audit',  icon: DocumentMagnifyingGlassIcon, minRole: 'L4' },
        { label: 'Settings',   href: '/admin/config', icon: Cog6ToothIcon, minRole: 'L0' },
      ],
    },
  ]
}

export function Sidebar() {
  const { isAtLeast } = useRBAC()
  const userRole      = useAuthStore((s) => s.userRole)
  const alertCount    = useAlertStore((s) => s.alertCount)
  const sections      = useNavSections(alertCount)

  const homeHref = userRole ? ROLE_HOME[userRole] : '/login'

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[260px] bg-surface border-r border-surface-border flex flex-col z-40 overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-surface-border">
        <p className="font-mono text-[9px] tracking-[3px] text-cyber-cyan opacity-70 uppercase mb-1.5">
          NHI · Governance Platform
        </p>
        <NavLink to={homeHref} className="font-display text-[13px] font-bold text-[#e2eeff] tracking-tight leading-tight">
          NHI<span className="text-cyber-cyan">ALPS</span>
        </NavLink>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4">
        {sections.map((section) => {
          const visible = section.items.filter((item) => isAtLeast(item.minRole))
          if (!visible.length) return null
          return (
            <div key={section.label} className="mb-2">
              <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#5a7a9a] px-5 py-2">
                {section.label}
              </p>
              {visible.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-5 py-2 text-[12.5px] text-[#b8cfe6] border-l-2 transition-all duration-150',
                      isActive
                        ? 'border-cyber-cyan bg-cyber-cyan/8 text-cyber-cyan'
                        : 'border-transparent hover:bg-cyber-cyan/6 hover:text-cyber-cyan hover:border-cyber-cyan/50',
                    )
                  }
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge ? (
                    <span className="font-mono text-[9px] bg-cyber-red/20 text-cyber-red border border-cyber-red/30 px-1.5 py-0.5 rounded">
                      {item.badge}
                    </span>
                  ) : null}
                </NavLink>
              ))}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-surface-border">
        <p className="font-mono text-[9px] text-[#5a7a9a] leading-relaxed">
          React 18 · Vite · TypeScript<br />Tailwind CSS · AWS · CDK<br />© 2025 — CONFIDENTIAL
        </p>
      </div>
    </aside>
  )
}
