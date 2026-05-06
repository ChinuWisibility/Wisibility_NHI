import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ClipboardDocumentCheckIcon, ExclamationTriangleIcon, ShieldCheckIcon, UsersIcon } from '@heroicons/react/24/outline'
import { nhiService } from '@/services/nhi.service'
import { complianceService } from '@/services/compliance.service'
import { policiesService } from '@/services/policies.service'

export default function ProgramDashboard() {
  const { data: summary }   = useQuery({ queryKey: ['nhi-summary'],    queryFn: nhiService.getSummary })
  const { data: campaigns } = useQuery({ queryKey: ['campaigns'],      queryFn: complianceService.listCampaigns })
  const { data: policies }  = useQuery({ queryKey: ['policies'],       queryFn: policiesService.list })

  const activeCampaigns   = campaigns?.filter((c) => c.status === 'ACTIVE') ?? []
  const pendingCerts      = activeCampaigns.reduce((s, c) => s + c.pending, 0)
  const enabledPolicies   = policies?.filter((p) => p.enabled) ?? []
  const violations        = enabledPolicies.filter((p) => p.affectedCount > 0).length

  const lifecycleItems = summary
    ? [
        { label: 'PROD',    count: summary.byEnvironment['PROD']    ?? 0, color: 'red'   as const },
        { label: 'STAGING', count: summary.byEnvironment['STAGING'] ?? 0, color: 'amber' as const },
        { label: 'DEV',     count: summary.byEnvironment['DEV']     ?? 0, color: 'cyan'  as const },
        { label: 'TEST',    count: summary.byEnvironment['TEST']    ?? 0, color: 'green' as const },
      ]
    : []

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Program Dashboard"
        subtitle="Lifecycle oversight, approval queue, policy alerts, and cross-team metrics."
        breadcrumbs={[{ label: 'Program Manager' }, { label: 'Dashboard' }]}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Pending Approvals" value={summary?.byStatus['PENDING'] ?? '—'} sub="NHI requests awaiting decision" icon={<ClipboardDocumentCheckIcon className="w-5 h-5" />} accent="amber" />
        <StatCard label="Active Campaigns"  value={activeCampaigns.length}              sub="Certification campaigns"        icon={<ShieldCheckIcon className="w-5 h-5" />}             accent="cyan" />
        <StatCard label="Policy Violations" value={violations}                          sub="Policies with active matches"   icon={<ExclamationTriangleIcon className="w-5 h-5" />}    accent={violations > 0 ? 'red' : 'green'} />
        <StatCard label="Teams Onboarded"   value={summary?.teamsCount ?? '—'}         sub="Claiming NHI ownership"         icon={<UsersIcon className="w-5 h-5" />}                   accent="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card accent="amber">
          <CardHeader>Certification Campaigns</CardHeader>
          {activeCampaigns.length > 0 ? (
            <div className="space-y-2">
              {activeCampaigns.map((c) => (
                <Link
                  key={c.campaignId}
                  to={`/compliance/campaigns/${c.campaignId}`}
                  className="flex items-center justify-between py-2.5 px-3 rounded border border-surface-border hover:border-cyber-cyan/40 hover:bg-cyber-cyan/5 transition-colors"
                >
                  <div>
                    <p className="text-xs text-bright font-medium">{c.name}</p>
                    <p className="font-mono text-[10px] text-muted mt-0.5">
                      {c.framework} · Due {new Date(c.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-cyber-cyan">{c.pending} pending</span>
                    <Badge color="amber">ACTIVE</Badge>
                  </div>
                </Link>
              ))}
              <p className="text-[10px] text-muted pt-1 font-mono">{pendingCerts} total decisions outstanding</p>
            </div>
          ) : (
            <p className="text-xs text-muted">No active campaigns.</p>
          )}
        </Card>

        <Card accent="cyan">
          <CardHeader>NHI Lifecycle by Environment</CardHeader>
          <div className="space-y-3 mb-4">
            {lifecycleItems.map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-3">
                <Badge color={color}>{label}</Badge>
                <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color === 'red' ? 'bg-cyber-red' : color === 'amber' ? 'bg-amber-400' : color === 'cyan' ? 'bg-cyber-cyan' : 'bg-green-400'}`}
                    style={{ width: summary ? `${Math.round((count / summary.total) * 100)}%` : '0%' }}
                  />
                </div>
                <span className="font-mono text-xs text-main w-14 text-right">{count.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-surface-border pt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted">In Vault</p>
              <p className="font-mono text-cyber-cyan">{summary?.inVault?.toLocaleString() ?? '—'}</p>
            </div>
            <div>
              <p className="text-muted">Not in Vault</p>
              <p className="font-mono text-cyber-red">{summary?.noVault?.toLocaleString() ?? '—'}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
