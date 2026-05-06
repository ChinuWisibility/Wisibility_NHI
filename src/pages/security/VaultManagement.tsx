import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { LockClosedIcon, ShieldCheckIcon, ExclamationTriangleIcon, ServerIcon } from '@heroicons/react/24/outline'
import { securityService } from '@/services/security.service'

const TYPE_LABEL: Record<string, string> = {
  VAULT_HASHICORP: 'HashiCorp Vault',
  VAULT_CYBERARK:  'CyberArk PAM',
  VAULT_AWS_SM:    'AWS Secrets Manager',
}

const STATUS_COLOR: Record<string, 'green'|'red'|'amber'> = {
  ACTIVE: 'green', ERROR: 'red', INACTIVE: 'amber',
}

export default function VaultManagement() {
  const { data, isLoading } = useQuery({
    queryKey: ['security-vaults'],
    queryFn:  securityService.getVaults,
  })

  const pct = data ? Math.round((data.totalInVault / data.total) * 100) : 0

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Vault Management"
        subtitle="Monitor HashiCorp Vault, CyberArk, and AWS Secrets Manager integrations."
        breadcrumbs={[{ label: 'Security' }, { label: 'Vault Management' }]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="In Vault"       value={data?.totalInVault ?? '—'} sub="NHIs vault-managed"    icon={<LockClosedIcon className="w-5 h-5" />}         accent="green" />
        <StatCard label="Not in Vault"   value={data?.totalWithout ?? '—'} sub="Active, unmanaged"     icon={<ExclamationTriangleIcon className="w-5 h-5" />} accent={data?.totalWithout ? 'red' : 'green'} />
        <StatCard label="Vault Coverage" value={data ? `${pct}%` : '—'}    sub="Of active inventory"   icon={<ShieldCheckIcon className="w-5 h-5" />}         accent={pct >= 80 ? 'green' : pct >= 50 ? 'amber' : 'red'} />
        <StatCard label="Vault Providers" value={data?.connectors.length ?? '—'} sub="Configured"     icon={<ServerIcon className="w-5 h-5" />}              accent="cyan" />
      </div>

      {isLoading && <div className="flex justify-center py-12"><Spinner size="lg" /></div>}

      {data && (
        <div className="space-y-4">
          <Card>
            <CardHeader>Vault Coverage</CardHeader>
            <div className="mb-4">
              <div className="flex justify-between text-xs text-muted mb-1">
                <span>NHIs in vault</span>
                <span>{pct}% ({data.totalInVault.toLocaleString()} of {data.total.toLocaleString()})</span>
              </div>
              <div className="h-3 bg-surface-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-green-400' : pct >= 50 ? 'bg-amber-400' : 'bg-cyber-red'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-muted">
              {data.totalWithout.toLocaleString()} active NHIs are not managed by a vault integration. Consider enrolling them to reduce exposure.
            </p>
          </Card>

          <Card>
            <CardHeader>Connected Vault Providers</CardHeader>
            {data.connectors.length > 0 ? (
              <div className="space-y-3">
                {data.connectors.map((c) => (
                  <div key={c.connectorId} className="flex items-center justify-between p-4 border border-surface-border rounded-lg hover:border-cyber-cyan/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <LockClosedIcon className="w-5 h-5 text-cyber-cyan flex-shrink-0" />
                      <div>
                        <p className="text-sm text-bright font-medium">{c.displayName}</p>
                        <p className="font-mono text-[10px] text-muted">{TYPE_LABEL[c.connectorType] ?? c.connectorType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-mono text-lg text-cyber-cyan">{c.nhiCount.toLocaleString()}</p>
                        <p className="text-[10px] text-muted">NHIs managed</p>
                      </div>
                      <Badge color={STATUS_COLOR[c.status] ?? 'cyan'}>{c.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted">No vault connectors configured. Add one in Discovery → Connectors.</p>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
