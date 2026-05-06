import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useAlerts } from '@/hooks/useAlerts'
import { useAlertStore } from '@/stores/alertStore'
import { BellAlertIcon, ExclamationTriangleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

export default function ITDRDashboard() {
  useAlerts()
  const alerts = useAlertStore((s) => s.activeAlerts)
  const alertCount = useAlertStore((s) => s.alertCount)

  const sev1 = alerts.filter((a) => a.severity === 'SEV1').length
  const byType = alerts.reduce<Record<string, number>>((acc, a) => {
    acc[a.alertType] = (acc[a.alertType] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="ITDR Dashboard"
        subtitle="Identity Threat Detection & Response — UEBA baselining, anomaly detection, and live alerts."
        breadcrumbs={[{ label: 'Monitoring' }, { label: 'ITDR' }]}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Open Alerts"   value={alertCount} sub="All severities"          icon={<BellAlertIcon className="w-5 h-5" />}           accent={alertCount > 0 ? 'red' : 'green'} />
        <StatCard label="SEV-1 Active"  value={sev1}       sub="Immediate response"      icon={<ExclamationTriangleIcon className="w-5 h-5" />} accent={sev1 > 0 ? 'red' : 'green'} />
        <StatCard label="Anomaly Types" value={Object.keys(byType).length} sub="Active detectors" icon={<ShieldCheckIcon className="w-5 h-5" />} accent="cyan" />
        <StatCard label="UEBA Baseline" value="Active" sub="90-day rolling window" icon={<ShieldCheckIcon className="w-5 h-5" />} accent="purple" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card accent="red">
          <CardHeader>Anomaly Breakdown</CardHeader>
          {Object.keys(byType).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(byType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                  <span className="text-xs text-main">{type.replace(/_/g, ' ')}</span>
                  <Badge color="red">{count}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted">No active anomalies detected. UEBA baseline is healthy.</p>
          )}
        </Card>
        <Card accent="cyan">
          <CardHeader>UEBA Detectors (8 Active)</CardHeader>
          <div className="space-y-1.5">
            {['Time-of-Day Anomaly', 'Volume Spike', 'Cross-Environment Access', 'Credential Sharing',
              'Lateral Movement', 'Privilege Escalation', 'Stale-Active Pattern', 'Geo Anomaly'].map((d) => (
              <div key={d} className="flex items-center gap-2 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyber-green flex-shrink-0" />
                <span className="text-xs text-main">{d}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
