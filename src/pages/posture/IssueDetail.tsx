import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { postureService } from '@/services/posture.service'
import toast from 'react-hot-toast'

const SEV_COLOR: Record<string, 'red'|'amber'|'cyan'|'green'> = {
  CRITICAL: 'red', HIGH: 'amber', MEDIUM: 'cyan', LOW: 'green',
}
const STATUS_COLOR: Record<string, 'amber'|'cyan'|'green'> = {
  OPEN: 'amber', ACKNOWLEDGED: 'cyan', REMEDIATED: 'green',
}

export default function IssueDetail() {
  const { id }  = useParams<{ id: string }>()
  const qc      = useQueryClient()

  const { data: issue, isLoading, isError } = useQuery({
    queryKey: ['posture-issue', id],
    queryFn:  () => postureService.getIssueById(id!),
    enabled:  !!id,
  })

  const remediate = useMutation({
    mutationFn: () => postureService.remediate(id!),
    onSuccess:  () => {
      toast.success('Issue marked as remediated')
      qc.invalidateQueries({ queryKey: ['posture-issue', id] })
      qc.invalidateQueries({ queryKey: ['posture-issues'] })
    },
    onError: () => toast.error('Failed to remediate'),
  })

  if (isLoading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>
  if (isError || !issue) return (
    <div className="text-center py-24 text-muted">Issue not found. <Link to="/posture/issues" className="text-cyber-cyan hover:underline">Back to issues</Link></div>
  )

  const detailEntries = Object.entries(issue.details ?? {})

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={issue.issueType.replace(/_/g, ' ')}
        subtitle={`Posture issue · ${issue.issueId}`}
        breadcrumbs={[
          { label: 'Posture', href: '/posture' },
          { label: 'Issues',  href: '/posture/issues' },
          { label: issue.issueId },
        ]}
        actions={
          issue.status !== 'REMEDIATED' ? (
            <Button variant="primary" size="sm" loading={remediate.isPending} onClick={() => remediate.mutate()}>
              Mark Remediated
            </Button>
          ) : null
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>Issue Summary</CardHeader>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div><p className="text-muted">Severity</p><Badge color={SEV_COLOR[issue.severity]}>{issue.severity}</Badge></div>
              <div><p className="text-muted">Status</p><Badge color={STATUS_COLOR[issue.status] ?? 'cyan'}>{issue.status}</Badge></div>
              <div><p className="text-muted">Issue Type</p><p className="text-main mt-1">{issue.issueType.replace(/_/g,' ')}</p></div>
              <div><p className="text-muted">Detected</p><p className="text-main mt-1">{new Date(issue.detectedAt).toLocaleString()}</p></div>
              {issue.remediatedAt && <div><p className="text-muted">Remediated</p><p className="text-main mt-1">{new Date(issue.remediatedAt).toLocaleString()}</p></div>}
              {issue.remediatedBy && <div><p className="text-muted">Remediated By</p><p className="font-mono text-cyber-cyan mt-1">{issue.remediatedBy}</p></div>}
            </div>
          </Card>

          <Card>
            <CardHeader>Technical Details</CardHeader>
            {detailEntries.length > 0 ? (
              <div className="space-y-2">
                {detailEntries.map(([k, v]) => (
                  <div key={k} className="flex items-start gap-3 py-2 border-b border-surface-border last:border-0 text-xs">
                    <span className="font-mono text-muted w-40 flex-shrink-0">{k}</span>
                    <span className="text-main break-all font-mono">
                      {Array.isArray(v) ? v.join(', ') : String(v)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted">No additional details.</p>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card accent="amber">
            <CardHeader>Affected NHI</CardHeader>
            {issue.nhi ? (
              <div className="space-y-2 text-xs">
                <p className="text-bright font-semibold">{issue.nhi.displayName}</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between"><span className="text-muted">Type</span><Badge color="cyan">{issue.nhi.nhiType}</Badge></div>
                  <div className="flex justify-between"><span className="text-muted">Risk</span><Badge color={SEV_COLOR[issue.nhi.riskLevel]}>{issue.nhi.riskLevel}</Badge></div>
                  <div className="flex justify-between"><span className="text-muted">Env</span><span className="text-main">{issue.nhi.environment}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Team</span><span className="text-main">{issue.nhi.ownerTeam ?? '—'}</span></div>
                </div>
                <Link
                  to={`/inventory/${issue.nhi.nhiId}`}
                  className="block mt-3 text-center font-mono text-[10px] text-cyber-cyan hover:underline"
                >
                  View NHI Detail →
                </Link>
              </div>
            ) : (
              <p className="text-xs text-muted">NHI {issue.nhiId}</p>
            )}
          </Card>

          <Card accent="red">
            <CardHeader>Remediation Steps</CardHeader>
            <div className="space-y-2 text-xs text-main">
              {issue.issueType === 'EXCESS_PERMISSIONS' && <>
                <p>1. Review current permission grants</p>
                <p>2. Apply least-privilege principle</p>
                <p>3. Remove unused permission scopes</p>
                <p>4. Verify service still functions</p>
              </>}
              {issue.issueType === 'PLAINTEXT_FOUND' && <>
                <p>1. Rotate the exposed credential immediately</p>
                <p>2. Remove plaintext from source/config</p>
                <p>3. Store in vault: vault.set(nhiId, secret)</p>
                <p>4. Scan git history for leaks</p>
              </>}
              {issue.issueType === 'SHARED_ACCOUNT' && <>
                <p>1. Audit all services using this account</p>
                <p>2. Provision separate NHI per service</p>
                <p>3. Update each service to its own identity</p>
                <p>4. Decommission shared account</p>
              </>}
              {issue.issueType === 'NO_OWNER' && <>
                <p>1. Identify the owning team via CMDB</p>
                <p>2. Assign ownerId in NHI record</p>
                <p>3. Notify the team of responsibility</p>
              </>}
              {issue.issueType === 'STALE_ACCOUNT' && <>
                <p>1. Confirm account is still needed</p>
                <p>2. If unused → archive the NHI</p>
                <p>3. If still needed → trigger rotation</p>
              </>}
              {issue.issueType === 'ENV_NOT_SEGREGATED' && <>
                <p>1. Provision separate NHI per environment</p>
                <p>2. Restrict each to its own env scope</p>
                <p>3. Rotate credentials in all environments</p>
              </>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
