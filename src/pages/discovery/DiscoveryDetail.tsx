import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { discoveryService } from '@/services/discovery.service'

const STATUS_COLOR: Record<string, 'green'|'red'|'amber'> = {
  COMPLETED: 'green', FAILED: 'red', RUNNING: 'amber',
}

export default function DiscoveryDetail() {
  const { id } = useParams<{ id: string }>()

  const { data: run, isLoading, isError } = useQuery({
    queryKey: ['discovery-run', id],
    queryFn:  () => discoveryService.getRunStatus(id!),
    enabled:  !!id,
    refetchInterval: (q) => q.state.data?.status === 'RUNNING' ? 2000 : false,
  })

  if (isLoading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>
  if (isError || !run) return (
    <div className="text-center py-24 text-muted">
      Run not found. <Link to="/discovery/runs" className="text-cyber-cyan hover:underline">Back to runs</Link>
    </div>
  )

  const duration = run.completedAt
    ? Math.round((new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)
    : null

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Discovery Run Detail"
        subtitle={`Run ${run.runId.slice(0, 8)}… · ${run.connectorType}`}
        breadcrumbs={[{ label: 'Discovery', href: '/discovery/runs' }, { label: run.runId.slice(0, 8) }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>Run Summary</CardHeader>
            <div className="grid grid-cols-2 gap-4 text-xs mb-4">
              <div><p className="text-muted">Status</p><Badge color={STATUS_COLOR[run.status]}>{run.status}</Badge></div>
              <div><p className="text-muted">Connector</p><p className="font-mono text-cyber-cyan mt-1">{run.connectorType}</p></div>
              <div><p className="text-muted">Started</p><p className="text-main mt-1">{new Date(run.startedAt).toLocaleString()}</p></div>
              <div><p className="text-muted">Completed</p><p className="text-main mt-1">{run.completedAt ? new Date(run.completedAt).toLocaleString() : '—'}</p></div>
              <div><p className="text-muted">Duration</p><p className="text-main mt-1">{duration !== null ? `${duration}s` : '—'}</p></div>
              <div><p className="text-muted">Triggered By</p><p className="font-mono text-cyber-cyan mt-1">{run.triggeredBy}</p></div>
            </div>
          </Card>

          <Card>
            <CardHeader>Discovery Results</CardHeader>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[
                { label: 'Discovered', value: run.nhisDiscovered, color: 'text-cyber-cyan' },
                { label: 'New',        value: run.nhisNew,        color: 'text-green-400' },
                { label: 'Updated',    value: run.nhisUpdated,    color: 'text-amber-400' },
                { label: 'Removed',    value: run.nhisRemoved,    color: 'text-cyber-red' },
              ].map(({ label, value, color }) => (
                <div key={label} className="py-4 border border-surface-border rounded-lg">
                  <p className={`font-mono text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
                  <p className="text-[11px] text-muted mt-1">{label}</p>
                </div>
              ))}
            </div>
          </Card>

          {run.errors.length > 0 && (
            <Card accent="red">
              <CardHeader>Errors</CardHeader>
              <div className="space-y-2">
                {run.errors.map((err, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-cyber-red/5 border border-cyber-red/20 rounded text-xs">
                    <span className="text-cyber-red font-mono mt-0.5">✕</span>
                    <span className="text-main">{err}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <Card accent="cyan">
          <CardHeader>Run ID</CardHeader>
          <p className="font-mono text-[10px] text-muted break-all mb-4">{run.runId}</p>
          <Link to="/discovery/runs" className="block text-center font-mono text-[10px] text-cyber-cyan hover:underline">
            ← All Discovery Runs
          </Link>
          {run.status === 'RUNNING' && (
            <div className="mt-4 flex items-center gap-2 text-xs text-cyber-cyan">
              <Spinner size="sm" />
              <span>Run in progress…</span>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
