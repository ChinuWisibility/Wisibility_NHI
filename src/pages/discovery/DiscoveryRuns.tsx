import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { useDiscoveryRuns } from '@/hooks/useDiscovery'
import { formatDateTime } from '@/utils/formatters'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export default function DiscoveryRuns() {
  const { data, isLoading } = useDiscoveryRuns()
  const runs = data?.items ?? []

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Discovery Runs"
        subtitle="History of all discovery scans with per-connector new, updated, and removed NHI counts."
        breadcrumbs={[{ label: 'Discovery' }, { label: 'Runs' }]}
      />
      <Card padding={false}>
        {isLoading && <div className="flex justify-center py-16"><Spinner size="lg" /></div>}
        {!isLoading && runs.length === 0 && (
          <EmptyState
            icon={<MagnifyingGlassIcon className="w-10 h-10" />}
            title="No discovery runs yet"
            message="Trigger your first discovery scan from the Connector Hub."
          />
        )}
        {runs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-surface-2 border-b border-surface-border">
                  {['Run ID', 'Connector', 'Status', 'Started', 'New', 'Updated', 'Removed', 'Errors'].map((h) => (
                    <th key={h} className="font-mono text-[10px] tracking-widest uppercase text-slate-600 px-4 py-3 text-left whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.runId} className="border-b border-surface-border hover:bg-cyber-cyan/5 transition-colors">
                    <td className="px-4 py-3 font-mono text-[10px] text-muted">{run.runId.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-main">{run.connectorType}</td>
                    <td className="px-4 py-3">
                      <Badge color={run.status === 'COMPLETED' ? 'green' : run.status === 'FAILED' ? 'red' : 'amber'}>
                        {run.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-muted">{formatDateTime(run.startedAt)}</td>
                    <td className="px-4 py-3 text-cyber-green">{run.nhisNew}</td>
                    <td className="px-4 py-3 text-cyber-amber">{run.nhisUpdated}</td>
                    <td className="px-4 py-3 text-cyber-red">{run.nhisRemoved}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-cyber-red">{run.errors.length}</td>
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
