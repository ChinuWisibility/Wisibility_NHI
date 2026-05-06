import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { alertService } from '@/services/alert.service'
import type { NHI } from '@/types/nhi.types'
import toast from 'react-hot-toast'

const SEV_COLOR: Record<string, 'red'|'amber'|'cyan'|'green'> = {
  SEV1: 'red', SEV2: 'amber', SEV3: 'cyan', SEV4: 'green',
}
const STATUS_COLOR: Record<string, 'red'|'amber'|'cyan'|'green'> = {
  OPEN: 'red', ACKNOWLEDGED: 'amber', RESOLVED: 'green', DISMISSED: 'cyan',
}

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>()
  const qc     = useQueryClient()

  const { data: alert, isLoading, isError } = useQuery({
    queryKey: ['alert', id],
    queryFn:  () => alertService.getById(id!),
    enabled:  !!id,
  })

  const escalate = useMutation({
    mutationFn: () => alertService.escalate(id!),
    onSuccess:  () => { toast.success('Alert escalated'); qc.invalidateQueries({ queryKey: ['alert', id] }) },
  })
  const dismiss = useMutation({
    mutationFn: () => alertService.dismiss(id!, 'Dismissed via incident detail'),
    onSuccess:  () => { toast.success('Alert dismissed'); qc.invalidateQueries({ queryKey: ['alert', id] }) },
  })

  if (isLoading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>
  if (isError || !alert) return (
    <div className="text-center py-24 text-muted">
      Alert not found. <Link to="/monitoring/alerts" className="text-cyber-cyan hover:underline">Back to alerts</Link>
    </div>
  )

  const nhi = alert.nhi as NHI | undefined
  const forensic = alert.forensicData ?? {}

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={`Incident: ${alert.alertType.replace(/_/g,' ')}`}
        subtitle={alert.description}
        breadcrumbs={[{ label: 'Monitoring', href: '/monitoring/alerts' }, { label: alert.alertId }]}
        actions={
          alert.status === 'OPEN' ? (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" loading={escalate.isPending} onClick={() => escalate.mutate()}>
                Escalate
              </Button>
              <Button variant="primary" size="sm" loading={dismiss.isPending} onClick={() => dismiss.mutate()}>
                Dismiss
              </Button>
            </div>
          ) : null
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>Alert Summary</CardHeader>
            <div className="grid grid-cols-2 gap-4 text-xs mb-4">
              <div><p className="text-muted">Severity</p><Badge color={SEV_COLOR[alert.severity]}>{alert.severity}</Badge></div>
              <div><p className="text-muted">Status</p><Badge color={STATUS_COLOR[alert.status]}>{alert.status}</Badge></div>
              <div><p className="text-muted">Anomaly Type</p><p className="text-main mt-1">{alert.alertType.replace(/_/g,' ')}</p></div>
              <div><p className="text-muted">Detected</p><p className="text-main mt-1">{new Date(alert.detectedAt).toLocaleString()}</p></div>
              {alert.assignedTo && <div><p className="text-muted">Assigned To</p><p className="font-mono text-cyber-cyan mt-1">{alert.assignedTo}</p></div>}
              {alert.resolvedAt  && <div><p className="text-muted">Resolved</p><p className="text-main mt-1">{new Date(alert.resolvedAt).toLocaleString()}</p></div>}
            </div>
          </Card>

          <Card>
            <CardHeader>Forensic Data</CardHeader>
            {Object.keys(forensic).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(forensic).map(([k, v]) => (
                  <div key={k} className="flex items-start gap-3 py-2 border-b border-surface-border/60 last:border-0 text-xs">
                    <span className="font-mono text-muted w-40 flex-shrink-0">{k}</span>
                    <span className="text-main break-all font-mono">
                      {Array.isArray(v) ? v.join(', ') : String(v)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted">No forensic data available.</p>
            )}
          </Card>

          <Card>
            <CardHeader>Timeline</CardHeader>
            <div className="space-y-3">
              {alert.timeline.map((event, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-cyber-cyan mt-1 flex-shrink-0" />
                    {i < alert.timeline.length - 1 && <div className="w-px flex-1 bg-surface-border mt-1" />}
                  </div>
                  <div className="pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-cyber-cyan">{event.action}</span>
                      <span className="font-mono text-[9px] text-muted">{new Date(event.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-main">by {event.actor}</p>
                    {event.detail && <p className="text-[11px] text-muted mt-0.5">{event.detail}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card accent="red">
            <CardHeader>Affected Identity</CardHeader>
            {nhi ? (
              <div className="space-y-2 text-xs">
                <p className="text-bright font-semibold">{nhi.displayName}</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between"><span className="text-muted">Type</span><Badge color="cyan">{nhi.nhiType}</Badge></div>
                  <div className="flex justify-between"><span className="text-muted">Risk</span><Badge color={SEV_COLOR[nhi.riskLevel] ?? 'cyan'}>{nhi.riskLevel}</Badge></div>
                  <div className="flex justify-between"><span className="text-muted">Env</span><span className="text-main">{nhi.environment}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Team</span><span className="text-main">{nhi.ownerTeam ?? '—'}</span></div>
                </div>
                <Link to={`/inventory/${nhi.nhiId}`} className="block mt-3 text-center font-mono text-[10px] text-cyber-cyan hover:underline">
                  View NHI Detail →
                </Link>
              </div>
            ) : (
              <p className="text-xs text-muted">NHI ID: {alert.nhiId}</p>
            )}
          </Card>

          <Card accent="amber">
            <CardHeader>Response Playbook</CardHeader>
            <div className="space-y-1.5 text-[11px] text-main">
              {alert.alertType === 'PRIV_ESCALATION' && <>
                <p>1. Revoke session immediately</p>
                <p>2. Rotate affected credentials</p>
                <p>3. Review access logs for scope of escalation</p>
                <p>4. File ITSM incident ticket</p>
              </>}
              {alert.alertType === 'CRED_SHARING' && <>
                <p>1. Identify all sessions using credential</p>
                <p>2. Terminate unauthorized sessions</p>
                <p>3. Rotate credential immediately</p>
                <p>4. Provision separate identities per service</p>
              </>}
              {alert.alertType === 'TIME_OF_DAY' && <>
                <p>1. Verify request origin and context</p>
                <p>2. Check for authorized maintenance window</p>
                <p>3. If unauthorized → revoke and rotate</p>
              </>}
              {alert.alertType === 'LATERAL_MOVEMENT' && <>
                <p>1. Block source account immediately</p>
                <p>2. Review all cross-account activity</p>
                <p>3. Notify cloud security team</p>
                <p>4. Capture forensic snapshot</p>
              </>}
              {!['PRIV_ESCALATION','CRED_SHARING','TIME_OF_DAY','LATERAL_MOVEMENT'].includes(alert.alertType) && <>
                <p>1. Assess alert severity and scope</p>
                <p>2. Collect forensic evidence above</p>
                <p>3. Engage appropriate team</p>
                <p>4. Document resolution in ITSM</p>
              </>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
