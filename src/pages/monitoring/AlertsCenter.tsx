import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAlerts, useDismissAlert } from '@/hooks/useAlerts'
import { useAlertStore } from '@/stores/alertStore'
import { formatRelativeTime, severityBg } from '@/utils/formatters'
import { BellAlertIcon } from '@heroicons/react/24/outline'
import type { AlertSeverity } from '@/types/alert.types'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

const TABS: (AlertSeverity | 'ALL')[] = ['ALL', 'SEV1', 'SEV2', 'SEV3', 'SEV4']

export default function AlertsCenter() {
  useAlerts()
  const alerts = useAlertStore((s) => s.activeAlerts)
  const dismiss = useDismissAlert()
  const [tab, setTab] = useState<AlertSeverity | 'ALL'>('ALL')

  const filtered = tab === 'ALL' ? alerts : alerts.filter((a) => a.severity === tab)

  const handleDismiss = async (id: string) => {
    try {
      await dismiss.mutateAsync({ id, justification: 'Dismissed from Alerts Center' })
      toast.success('Alert dismissed')
    } catch {
      toast.error('Failed to dismiss alert')
    }
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Alerts Center"
        subtitle="Real-time NHI threat alerts with SEV classification and incident timeline."
        breadcrumbs={[{ label: 'Monitoring' }, { label: 'Alerts' }]}
      />

      {/* SEV tabs */}
      <div className="flex gap-1 mb-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'font-mono text-[10px] tracking-wide px-3 py-1.5 rounded border transition-colors',
              tab === t
                ? 'border-cyber-cyan bg-cyber-cyan/10 text-cyber-cyan'
                : 'border-surface-border text-[#5a7a9a] hover:text-[#b8cfe6]',
              t === 'SEV1' && tab === 'SEV1' && 'animate-pulse-slow',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <Card padding={false}>
        {filtered.length === 0 && (
          <EmptyState
            icon={<BellAlertIcon className="w-10 h-10" />}
            title="No alerts"
            message="No active alerts for this severity level."
          />
        )}
        {filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-surface-2 border-b border-surface-border">
                  {['Severity', 'Type', 'Description', 'Detected', 'NHI', ''].map((h) => (
                    <th key={h} className="font-mono text-[10px] tracking-widest uppercase text-cyber-cyan px-4 py-3 text-left whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((alert) => (
                  <tr
                    key={alert.alertId}
                    className={cn(
                      'border-b border-surface-border/70 hover:bg-cyber-cyan/5 transition-colors',
                      alert.severity === 'SEV1' && 'bg-cyber-red/5',
                    )}
                  >
                    <td className="px-4 py-3">
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded border ${severityBg(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#b8cfe6]">{alert.alertType.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-[#5a7a9a] max-w-xs truncate">{alert.description}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-[#5a7a9a]">{formatRelativeTime(alert.detectedAt)}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-cyber-cyan">{alert.nhiId.slice(0, 10)}…</td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={dismiss.isPending}
                        onClick={() => handleDismiss(alert.alertId)}
                      >
                        Dismiss
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
