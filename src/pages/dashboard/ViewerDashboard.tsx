import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MagnifyingGlassIcon, ShieldCheckIcon, BellAlertIcon, KeyIcon } from '@heroicons/react/24/outline'
import { nhiService } from '@/services/nhi.service'
import { postureService } from '@/services/posture.service'
import { alertService } from '@/services/alert.service'
import { discoveryService } from '@/services/discovery.service'

export default function ViewerDashboard() {
  const { data: summary }    = useQuery({ queryKey: ['nhi-summary'],     queryFn: nhiService.getSummary })
  const { data: posture }    = useQuery({ queryKey: ['posture-report'],  queryFn: postureService.getReport })
  const { data: alerts }     = useQuery({ queryKey: ['alerts'],          queryFn: () => alertService.list({ limit: 100 }) })
  const { data: connectors } = useQuery({ queryKey: ['connectors'],      queryFn: discoveryService.listConnectors })

  const openAlerts   = alerts?.items.filter((a) => a.status === 'OPEN').length ?? 0
  const activeCons   = connectors?.filter((c) => c.status === 'ACTIVE').length ?? 0
  const scoreColor   = (posture?.score ?? 0) >= 70 ? 'green' : (posture?.score ?? 0) >= 50 ? 'amber' : 'red'

  const riskItems = summary
    ? ([
        ['CRITICAL', summary.byRisk['CRITICAL'] ?? 0, 'red'],
        ['HIGH',     summary.byRisk['HIGH']     ?? 0, 'amber'],
        ['MEDIUM',   summary.byRisk['MEDIUM']   ?? 0, 'cyan'],
        ['LOW',      summary.byRisk['LOW']       ?? 0, 'green'],
      ] as [string, number, 'red'|'amber'|'cyan'|'green'][])
    : []

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Viewer Dashboard"
        subtitle="Read-only summary of the NHI governance platform."
        breadcrumbs={[{ label: 'Viewer' }, { label: 'Dashboard' }]}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total NHIs"    value={summary?.total ?? '—'}       sub="Across all environments"  icon={<KeyIcon className="w-5 h-5" />}             accent="cyan" />
        <StatCard label="Posture Score" value={posture ? `${posture.score}` : '—'} sub={`Delta ${posture?.scoreDelta ?? 0}`} icon={<ShieldCheckIcon className="w-5 h-5" />} accent={scoreColor} />
        <StatCard label="Open Alerts"   value={openAlerts}                  sub="Requiring attention"      icon={<BellAlertIcon className="w-5 h-5" />}       accent={openAlerts > 0 ? 'amber' : 'green'} />
        <StatCard label="Connectors"    value={activeCons}                  sub="Active integrations"      icon={<MagnifyingGlassIcon className="w-5 h-5" />} accent="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card accent="cyan">
          <CardHeader>NHI Risk Breakdown</CardHeader>
          {riskItems.length > 0 ? (
            <div className="space-y-3">
              {riskItems.map(([label, count, color]) => (
                <div key={label} className="flex items-center gap-3">
                  <Badge color={color}>{label}</Badge>
                  <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color === 'red' ? 'bg-cyber-red' : color === 'amber' ? 'bg-amber-400' : color === 'cyan' ? 'bg-cyber-cyan' : 'bg-green-400'}`}
                      style={{ width: `${summary ? Math.round((count / summary.total) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-main w-12 text-right">{count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted">Loading…</p>
          )}
        </Card>

        <Card accent="purple">
          <CardHeader>Environment Distribution</CardHeader>
          {summary ? (
            <div className="space-y-3">
              {(['PROD','STAGING','DEV','TEST'] as const).map((env) => {
                const count = summary.byEnvironment[env] ?? 0
                const pct   = Math.round((count / summary.total) * 100)
                return (
                  <div key={env} className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-main w-14">{env}</span>
                    <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-cyber-cyan/70" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="font-mono text-xs text-muted w-16 text-right">{count.toLocaleString()} ({pct}%)</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-muted">Loading…</p>
          )}
        </Card>
      </div>
    </div>
  )
}
