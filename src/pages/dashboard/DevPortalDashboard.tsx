import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { KeyIcon, ArrowPathIcon, DocumentTextIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import { nhiService } from '@/services/nhi.service'
import { securityService } from '@/services/security.service'
import { auditService } from '@/services/audit.service'

const VAULT_STEPS = [
  '1. Request an NHI via this portal',
  '2. Approved NHI credentials stored in vault',
  '3. Use SDK: vault.getSecret(nhiId)',
  '4. Credentials auto-rotate on schedule',
]

export default function DevPortalDashboard() {
  const navigate = useNavigate()
  const { data: summary }  = useQuery({ queryKey: ['nhi-summary'],   queryFn: nhiService.getSummary })
  const { data: rotation } = useQuery({ queryKey: ['rotation'],      queryFn: securityService.getRotation })
  const { data: auditLog } = useQuery({ queryKey: ['audit-log'],     queryFn: () => auditService.list({ limit: 5 }) })

  const pending    = summary?.byStatus['PENDING'] ?? 0
  const inVault    = summary?.inVault ?? 0
  const dueSoon7   = rotation?.jobs.filter((j) => j.daysUntil <= 7).length ?? 0

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Developer Portal"
        subtitle="Your NHIs, pending requests, vault SDK guide, and rotation status."
        breadcrumbs={[{ label: 'Dev Portal' }, { label: 'Dashboard' }]}
        actions={
          <Button variant="primary" onClick={() => navigate('/dev/request')}>
            + Request NHI
          </Button>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total NHIs"        value={summary?.total ?? '—'} sub="Platform inventory"    icon={<KeyIcon className="w-5 h-5" />}          accent="cyan" />
        <StatCard label="Pending Requests"  value={pending}               sub="Awaiting approval"     icon={<DocumentTextIcon className="w-5 h-5" />} accent={pending > 0 ? 'amber' : 'green'} />
        <StatCard label="Due for Rotation"  value={dueSoon7}              sub="Next 7 days"           icon={<ArrowPathIcon className="w-5 h-5" />}    accent={dueSoon7 > 0 ? 'red' : 'green'} />
        <StatCard label="Vault Onboarded"   value={inVault}               sub="Secrets managed"       icon={<ShieldCheckIcon className="w-5 h-5" />}  accent="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card accent="cyan">
          <CardHeader>Vault SDK Quick Start</CardHeader>
          <div className="space-y-3 text-xs text-main">
            <p className="text-muted">Use the vault SDK to inject credentials at runtime. Never hardcode secrets.</p>
            {VAULT_STEPS.map((step) => (
              <div key={step} className="flex items-start gap-2">
                <span className="font-mono text-cyber-cyan text-[10px] mt-0.5">{step[0]}</span>
                <p className="font-mono text-[10px]">{step.slice(3)}</p>
              </div>
            ))}
            <div className="mt-3 p-3 bg-surface-2 border border-surface-border rounded font-mono text-[10px] text-cyber-cyan">
              <p className="text-muted mb-1">// TypeScript example</p>
              <p>{'import { vault } from "@nhi-alps/sdk"'}</p>
              <p>{'const secret = await vault.getSecret(nhiId)'}</p>
            </div>
          </div>
        </Card>

        <Card accent="amber">
          <CardHeader>Recent Platform Activity</CardHeader>
          {auditLog && auditLog.items.length > 0 ? (
            <div className="space-y-1">
              {auditLog.items.map((e) => (
                <div key={e.eventId} className="flex items-start gap-2 py-2 border-b border-surface-border last:border-0">
                  <Badge color="cyan">{e.actorRole}</Badge>
                  <div className="min-w-0">
                    <p className="text-[11px] text-main truncate">{e.action.replace(/_/g, ' ')}</p>
                    <p className="font-mono text-[9px] text-muted">
                      {e.resourceType} · {new Date(e.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted">No recent activity.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
