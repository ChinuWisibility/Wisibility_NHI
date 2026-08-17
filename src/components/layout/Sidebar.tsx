import { NavLink } from 'react-router-dom'
import {
  Squares2X2Icon, ShieldCheckIcon, MagnifyingGlassIcon,
  ExclamationTriangleIcon, LockClosedIcon, BellAlertIcon,
  ClipboardDocumentCheckIcon, UsersIcon, Cog6ToothIcon,
  DocumentMagnifyingGlassIcon, FingerPrintIcon, CheckBadgeIcon,
  ShareIcon, FireIcon, SparklesIcon, WrenchScrewdriverIcon,
  CubeTransparentIcon, KeyIcon, ClockIcon, BoltIcon,
} from '@heroicons/react/24/outline'
import { useRBAC } from '@/hooks/useRBAC'
import { useAuthStore } from '@/stores/authStore'
import { ROLE_HOME } from '@/config/routes'
import { useAlertStore } from '@/stores/alertStore'
import { useUIStore } from '@/stores/uiStore'
import { BRANDING } from '@/constants/branding'
import type { UserRole } from '@/types/user.types'
import { cn } from '@/utils/cn'
import { SIDEBAR_COLLAPSED, SIDEBAR_EXPANDED } from './constants'

interface NavSection {
  label: string
  items: NavItem[]
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
      label: 'Dashboard',
      items: [
        { label: 'Command Center', href: '/dashboard', icon: Squares2X2Icon, minRole: 'L5' },
        { label: 'Identity Graph', href: '/intelligence/graph', icon: ShareIcon, minRole: 'L2' },
      ],
    },
    {
      label: 'NHI Inventory',
      items: [
        { label: 'All NHIs', href: '/inventory', icon: CubeTransparentIcon, minRole: 'L2' },
        { label: 'Request NHI', href: '/dev/request', icon: DocumentMagnifyingGlassIcon, minRole: 'L3' },
      ],
    },
    {
      label: 'Discovery',
      items: [
        { label: 'Discovery Sources', href: '/discovery/connectors', icon: Cog6ToothIcon, minRole: 'L0' },
        { label: 'Discovery Runs', href: '/discovery/runs', icon: MagnifyingGlassIcon, minRole: 'L2' },
        { label: 'Unmanaged NHIs', href: '/discovery/unmanaged', icon: ExclamationTriangleIcon, minRole: 'L2' },
      ],
    },
    {
      label: 'Intelligence',
      items: [
        { label: 'Lineage', href: '/intelligence/lineage', icon: ShareIcon, minRole: 'L2' },
        { label: 'Ownership', href: '/intelligence/ownership', icon: UsersIcon, minRole: 'L2' },
        { label: 'Blast Radius', href: '/intelligence/blast-radius', icon: FireIcon, minRole: 'L2' },
      ],
    },
    {
      label: 'Governance',
      items: [
        { label: 'Policies', href: '/admin/policies', icon: ShieldCheckIcon, minRole: 'L0' },
        { label: 'Lifecycle', href: '/governance/lifecycle', icon: ClipboardDocumentCheckIcon, minRole: 'L2' },
        { label: 'Certifications', href: '/compliance/campaigns', icon: CheckBadgeIcon, minRole: 'L1' },
        { label: 'SoD', href: '/governance/sod', icon: ExclamationTriangleIcon, minRole: 'L2' },
        { label: 'Compliance', href: '/compliance/mapping', icon: ClipboardDocumentCheckIcon, minRole: 'L4' },
      ],
    },
    {
      label: 'Risk & Posture',
      items: [
        { label: 'Risk Dashboard', href: '/posture', icon: ShieldCheckIcon, minRole: 'L2' },
        { label: 'Findings', href: '/posture/issues', icon: ExclamationTriangleIcon, minRole: 'L2' },
        { label: 'Excess Privilege', href: '/security/hygiene', icon: KeyIcon, minRole: 'L2' },
        { label: 'Dormant NHIs', href: '/risk/dormant', icon: ClockIcon, minRole: 'L2' },
        { label: 'Orphaned NHIs', href: '/risk/orphaned', icon: UsersIcon, minRole: 'L2' },
        { label: 'Expiring Credentials', href: '/risk/expiring', icon: LockClosedIcon, minRole: 'L2' },
      ],
    },
    {
      label: 'Remediation',
      items: [
        { label: 'Recommendations', href: '/remediation/recommendations', icon: WrenchScrewdriverIcon, minRole: 'L2' },
        { label: 'Workflows', href: '/remediation/workflows', icon: ClipboardDocumentCheckIcon, minRole: 'L2' },
        { label: 'Rotation Center', href: '/security/rotation', icon: KeyIcon, minRole: 'L2' },
      ],
    },
    {
      label: 'Threat Detection',
      items: [
        { label: 'Anomalies', href: '/monitoring/itdr', icon: ShieldCheckIcon, minRole: 'L2' },
        { label: 'Alerts', href: '/monitoring/alerts', icon: BellAlertIcon, minRole: 'L2', badge: alertCount },
        { label: 'Attack Paths', href: '/threat/attack-paths', icon: FireIcon, minRole: 'L2' },
        { label: 'Response', href: '/threat/response', icon: BoltIcon, minRole: 'L2' },
      ],
    },
    {
      label: 'AI Agents',
      items: [
        { label: 'Agent Inventory', href: '/ai/agents', icon: SparklesIcon, minRole: 'L2' },
        { label: 'Agent Mapping', href: '/ai/mapping', icon: ShareIcon, minRole: 'L2' },
        { label: 'Agent Risk', href: '/ai/risk', icon: ShieldCheckIcon, minRole: 'L2' },
      ],
    },
    {
      label: 'Administration',
      items: [
        { label: 'Users & Roles', href: '/admin/users', icon: UsersIcon, minRole: 'L0' },
        { label: 'Vaults', href: '/security/vaults', icon: LockClosedIcon, minRole: 'L0' },
        { label: 'Audit Evidence', href: '/admin/audit', icon: DocumentMagnifyingGlassIcon, minRole: 'L4' },
        { label: 'Export Center', href: '/compliance/export', icon: DocumentMagnifyingGlassIcon, minRole: 'L4' },
        { label: 'Settings', href: '/admin/config', icon: Cog6ToothIcon, minRole: 'L0' },
      ],
    },
  ]
}

export function Sidebar() {
  const { isAtLeast } = useRBAC()
  const userRole      = useAuthStore((s) => s.userRole)
  const alertCount    = useAlertStore((s) => s.alertCount)
  const sections      = useNavSections(alertCount)
  const open          = useUIStore((s) => s.sidebarOpen)

  const homeHref = userRole ? ROLE_HOME[userRole] : '/login'
  const width = open ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 flex flex-col z-40 overflow-hidden"
      style={{
        width,
        backgroundImage:
          'radial-gradient(140% 90% at 0% 0%, #243a5e 0%, rgba(0,0,0,0) 55%), radial-gradient(120% 80% at 100% 100%, rgba(79,140,255,0.12) 0%, rgba(0,0,0,0) 55%), linear-gradient(165deg, #1d2e4f 0%, #1b2f52 35%, #182542 70%, #151f35 100%)',
        borderRight: '1px solid #253554',
        boxShadow: '6px 0 22px rgba(10,16,28,0.35)',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <div
        className="flex items-center border-b shrink-0"
        style={{ height: 63, borderColor: '#253554', paddingLeft: open ? 20 : 0, paddingRight: open ? 20 : 0, justifyContent: open ? 'flex-start' : 'center' }}
      >
        <NavLink to={homeHref} className="flex items-center gap-3 min-w-0">
          <span
            className="flex items-center justify-center shrink-0"
            style={{
              width: open ? 36 : 30,
              height: open ? 36 : 30,
              borderRadius: open ? 11 : 10,
              background: 'linear-gradient(145deg, #3b82f6cc, #3b82f6)',
              boxShadow: '0 5px 0 rgba(59,130,246,0.3), 0 8px 16px rgba(59,130,246,0.2)',
            }}
          >
            <FingerPrintIcon className="text-white" style={{ width: open ? 20 : 18, height: open ? 20 : 18 }} />
          </span>
          {open && (
            <span className="min-w-0">
              <span className="block text-white font-extrabold uppercase tracking-tight leading-tight text-[15px]">
                {BRANDING.company}
              </span>
              <span className="block text-[#c5d4e8] font-semibold uppercase text-[10px] tracking-wide">
                {BRANDING.product}
              </span>
            </span>
          )}
        </NavLink>
      </div>

      <nav
        className="flex-1 overflow-y-auto"
        style={{ paddingTop: open ? 6 : 8, paddingBottom: 8, scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}
      >
        {sections.map((section) => {
          const visible = section.items.filter((item) => isAtLeast(item.minRole))
          if (!visible.length) return null
          return (
            <div key={section.label} className="mb-1">
              {open && (
                <p className="px-4 pt-3 pb-1 text-[10px] font-semibold tracking-wide text-[#a8bdd4]">
                  {section.label.toUpperCase()}
                </p>
              )}
              {visible.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/dashboard' || item.href === '/inventory'}
                  title={!open ? item.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      'relative flex items-center transition-all duration-200',
                      open ? 'mx-2 mb-1 px-2.5 min-h-[42px] rounded-[10px] gap-2.5' : 'mx-2 mb-1.5 justify-center min-h-[48px] rounded-[14px]',
                      isActive ? 'text-white' : 'text-[#c5d4e8] hover:bg-white/[0.08] hover:translate-x-0.5',
                    )
                  }
                  style={({ isActive }) => isActive ? {
                    background: open ? 'rgba(79,140,255,0.18)' : 'rgba(79,140,255,0.24)',
                    boxShadow: open ? 'inset 0 0 0 1px rgba(79,140,255,0.22)' : '0 10px 18px rgba(79,140,255,0.18)',
                  } : undefined}
                >
                  {({ isActive }) => (
                    <>
                      {open && isActive && (
                        <span
                          className="absolute left-1.5 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded"
                          style={{ background: '#4f8cff', boxShadow: '0 0 8px rgba(79,140,255,0.6)' }}
                        />
                      )}
                      <item.icon className="w-[19px] h-[19px] shrink-0" />
                      {open && (
                        <>
                          <span className={cn('flex-1 text-[13.5px] tracking-tight', isActive ? 'font-semibold' : 'font-medium')}>
                            {item.label}
                          </span>
                          {item.badge ? (
                            <span className="text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-400/30 px-1.5 py-0.5 rounded-md">
                              {item.badge}
                            </span>
                          ) : null}
                        </>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          )
        })}
      </nav>

      {open && (
        <div className="p-3 border-t shrink-0" style={{ borderColor: '#253554', background: 'rgba(0,0,0,0.1)' }}>
          <div
            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <CheckBadgeIcon className="w-4 h-4 text-[#c5d4e8]" />
            <span className="text-[#c5d4e8] font-semibold text-[11px] tracking-wide">
              {BRANDING.product} {BRANDING.version}
            </span>
          </div>
        </div>
      )}
    </aside>
  )
}
