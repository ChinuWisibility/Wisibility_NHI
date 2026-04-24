import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useAlertStore } from '@/stores/alertStore'
import { useAlerts } from '@/hooks/useAlerts'
import { usePostureReport } from '@/hooks/usePosture'
import { ShieldCheckIcon, BellAlertIcon, ExclamationTriangleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { formatRelativeTime } from '@/utils/formatters'

export default function SecurityOpsDashboard() {
  useAlerts()
  const alerts      = useAlertStore((s) => s.activeAlerts)
  const alertCount  = useAlertStore((s) => s.alertCount)
  const { data: posture } = usePostureReport()

  const sev1 = alerts.filter((a) => a.severity === 'SEV1').length
  const sev2 = alerts.filter((a) => a.severity === 'SEV2').length

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Security Ops Dashboard"
        subtitle="Live posture score, active ITDR alerts, and risk overview."
        breadcrumbs={[{ label: 'Security Ops' }, { label: 'Dashboard' }]}
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Posture Score"
          value={posture ? `${posture.score}%` : '—'}
          sub={posture ? `${posture.scoreDelta > 0 ? '+' : ''}${posture.scoreDelta}% vs last week` : 'Loading…'}
          icon={<ShieldCheckIcon className="w-5 h-5" />}
          accent="green"
        />
        <StatCard
          label="Open Alerts"
          value={alertCount}
          sub="All severities"
          icon={<BellAlertIcon className="w-5 h-5" />}
          accent={alertCount > 0 ? 'red' : 'cyan'}
        />
        <StatCard
          label="SEV-1 Active"
          value={sev1}
          sub="Immediate response required"
          icon={<ExclamationTriangleIcon className="w-5 h-5" />}
          accent={sev1 > 0 ? 'red' : 'green'}
        />
        <StatCard
          label="SEV-2 Active"
          value={sev2}
          sub="High priority"
          icon={<MagnifyingGlassIcon className="w-5 h-5" />}
          accent={sev2 > 0 ? 'amber' : 'cyan'}
        />
      </div>

      {/* Posture issues + Recent alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card accent="cyan">
          <CardHeader>Posture Issues by Category</CardHeader>
          {posture ? (
            <div className="space-y-2">
              {Object.entries(posture.issueCount).map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                  <span className="text-xs text-[#b8cfe6]">{cat.replace(/_/g, ' ')}</span>
                  <Badge color={count > 0 ? 'amber' : 'green'}>{count}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#5a7a9a]">Loading posture data…</p>
          )}
        </Card>

        <Card accent="red">
          <CardHeader>Recent Active Alerts</CardHeader>
          {alerts.length > 0 ? (
            <div className="space-y-2">
              {alerts.slice(0, 6).map((alert) => (
                <div key={alert.alertId} className="flex items-start gap-3 py-2 border-b border-surface-border last:border-0">
                  <Badge color={alert.severity === 'SEV1' ? 'red' : alert.severity === 'SEV2' ? 'amber' : 'cyan'}>
                    {alert.severity}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#b8cfe6] truncate">{alert.description}</p>
                    <p className="font-mono text-[10px] text-[#5a7a9a]">{formatRelativeTime(alert.detectedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#5a7a9a]">No active alerts — system nominal</p>
          )}
        </Card>
      </div>
    </div>
  )
}
