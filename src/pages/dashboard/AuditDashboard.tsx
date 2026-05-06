import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ClipboardDocumentCheckIcon, DocumentArrowDownIcon, ShieldCheckIcon, FlagIcon } from '@heroicons/react/24/outline'
import { complianceService } from '@/services/compliance.service'

const FW_COLOR: Record<string, 'green'|'cyan'|'amber'|'red'|'purple'> = {
  SOX: 'cyan', PCI_DSS: 'green', DORA: 'amber', ISO_27001: 'purple', SOC2: 'cyan',
}

export default function AuditDashboard() {
  const { data: scores }    = useQuery({ queryKey: ['compliance-scores'],  queryFn: complianceService.getScores })
  const { data: campaigns } = useQuery({ queryKey: ['campaigns'],          queryFn: complianceService.listCampaigns })

  const sox     = scores?.find((s) => s.framework === 'SOX')
  const pci     = scores?.find((s) => s.framework === 'PCI_DSS')
  const dora    = scores?.find((s) => s.framework === 'DORA')
  const pending = campaigns?.reduce((s, c) => c.status === 'ACTIVE' ? s + c.pending : s, 0) ?? 0

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Audit & Compliance Dashboard"
        subtitle="Compliance scores, upcoming certification campaigns, and evidence exports."
        breadcrumbs={[{ label: 'Audit' }, { label: 'Dashboard' }]}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="SOX Compliance"  value={sox  ? `${sox.score}%`  : '—'} sub={sox  ? `${sox.passing}/${sox.controls} controls`  : 'Loading'} icon={<ClipboardDocumentCheckIcon className="w-5 h-5" />} accent="cyan" />
        <StatCard label="PCI DSS"         value={pci  ? `${pci.score}%`  : '—'} sub={pci  ? `${pci.passing}/${pci.controls} controls`  : 'Loading'} icon={<ShieldCheckIcon className="w-5 h-5" />}             accent="green" />
        <StatCard label="DORA"            value={dora ? `${dora.score}%` : '—'} sub={dora ? `${dora.passing}/${dora.controls} controls` : 'Loading'} icon={<FlagIcon className="w-5 h-5" />}                   accent="amber" />
        <StatCard label="Pending Certs"   value={pending}                        sub="Awaiting decision"                                             icon={<DocumentArrowDownIcon className="w-5 h-5" />}      accent={pending > 0 ? 'amber' : 'green'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card accent="purple">
          <CardHeader>All Framework Scores</CardHeader>
          {scores ? (
            <div className="space-y-3">
              {scores.map((s) => (
                <div key={s.framework} className="flex items-center gap-3">
                  <Badge color={FW_COLOR[s.framework] ?? 'cyan'}>{s.framework.replace('_',' ')}</Badge>
                  <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${s.score >= 80 ? 'bg-green-400' : s.score >= 60 ? 'bg-amber-400' : 'bg-cyber-red'}`}
                      style={{ width: `${s.score}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-main w-10 text-right">{s.score}%</span>
                  <span className="font-mono text-[10px] text-muted w-16 text-right">{s.failing} failing</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted">Loading…</p>
          )}
        </Card>

        <Card accent="cyan">
          <CardHeader>Active Campaigns</CardHeader>
          {campaigns && campaigns.length > 0 ? (
            <div className="space-y-2">
              {campaigns.map((c) => (
                <Link
                  key={c.campaignId}
                  to={`/compliance/campaigns/${c.campaignId}`}
                  className="flex items-center justify-between py-2.5 px-3 rounded border border-surface-border hover:border-cyber-cyan/40 hover:bg-cyber-cyan/5 transition-colors"
                >
                  <div>
                    <p className="text-xs text-bright font-medium">{c.name}</p>
                    <p className="font-mono text-[10px] text-muted">
                      {c.framework} · Due {new Date(c.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-cyber-cyan">{c.pending} pending</span>
                    <Badge color={c.status === 'ACTIVE' ? 'amber' : c.status === 'CLOSED' ? 'green' : 'cyan'}>
                      {c.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted">No campaigns found.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
