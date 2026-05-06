import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader } from '@/components/ui/Card'
import { useConnectors } from '@/hooks/useDiscovery'
import { Badge } from '@/components/ui/Badge'
import { Cog6ToothIcon, UsersIcon, ServerIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

export default function AdminDashboard() {
  const { data: connectors } = useConnectors()
  const active = connectors?.filter((c) => c.status === 'ACTIVE').length ?? 0
  const error  = connectors?.filter((c) => c.status === 'ERROR').length ?? 0

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Admin Dashboard"
        subtitle="System health, connector status, and platform configuration overview."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Dashboard' }]}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Connectors"  value={active}                      sub="Healthy"             icon={<ServerIcon className="w-5 h-5" />}      accent="green" />
        <StatCard label="Connector Errors"   value={error}                       sub="Needs attention"     icon={<Cog6ToothIcon className="w-5 h-5" />}   accent={error > 0 ? 'red' : 'green'} />
        <StatCard label="Platform Status"    value="Operational"                  sub="All systems nominal" icon={<ShieldCheckIcon className="w-5 h-5" />} accent="green" />
        <StatCard label="Total Connectors"   value={connectors?.length ?? '—'}   sub="Configured"         icon={<UsersIcon className="w-5 h-5" />}       accent="cyan" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card accent="cyan">
          <CardHeader>Connector Status</CardHeader>
          {connectors && connectors.length > 0 ? (
            <div className="space-y-2">
              {connectors.map((c) => (
                <div key={c.connectorId} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                  <div>
                    <p className="text-xs text-main">{c.displayName}</p>
                    <p className="font-mono text-[10px] text-muted">{c.connectorType}</p>
                  </div>
                  <Badge color={c.status === 'ACTIVE' ? 'green' : c.status === 'ERROR' ? 'red' : 'amber'}>
                    {c.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted">No connectors configured. Add one in Discovery → Connectors.</p>
          )}
        </Card>
        <Card accent="amber">
          <CardHeader>Quick Actions</CardHeader>
          <div className="space-y-2 text-xs text-main">
            {[
              { label: 'Add Connector',     href: '/discovery/connectors' },
              { label: 'Manage Users',      href: '/admin/users' },
              { label: 'System Config',     href: '/admin/config' },
              { label: 'View Audit Log',    href: '/admin/audit' },
              { label: 'Vault Management',  href: '/security/vaults' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block py-2 px-3 rounded border border-surface-border hover:border-cyber-cyan/40 hover:bg-cyber-cyan/5 hover:text-cyber-cyan transition-colors"
              >
                {link.label} →
              </a>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
