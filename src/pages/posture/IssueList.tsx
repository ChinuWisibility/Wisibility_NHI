import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { usePostureIssues, useRemediateIssue } from '@/hooks/usePosture'
import { formatRelativeTime } from '@/utils/formatters'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function IssueList() {
  const { data, isLoading } = usePostureIssues({ status: 'OPEN', limit: 50 })
  const remediate = useRemediateIssue()

  const handleRemediate = async (id: string) => {
    try {
      await remediate.mutateAsync(id)
      toast.success('Issue remediated')
    } catch {
      toast.error('Remediation failed')
    }
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Posture Issues"
        subtitle="Open issues detected by the daily posture engine across all NHIs."
        breadcrumbs={[{ label: 'Posture', href: '/posture' }, { label: 'Issues' }]}
      />
      <Card padding={false}>
        {isLoading && <div className="flex justify-center py-16"><Spinner size="lg" /></div>}
        {!isLoading && (!data || data.items.length === 0) && (
          <EmptyState
            icon={<ShieldCheckIcon className="w-10 h-10" />}
            title="No open issues"
            message="All posture issues are resolved. Great work!"
          />
        )}
        {data && data.items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-surface-2 border-b border-surface-border">
                  {['NHI', 'Issue Type', 'Severity', 'Detected', 'Status', ''].map((h) => (
                    <th key={h} className="font-mono text-[10px] tracking-widest uppercase text-cyber-cyan px-4 py-3 text-left whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((issue) => (
                  <tr key={issue.issueId} className="border-b border-surface-border/70 hover:bg-cyber-cyan/5 transition-colors">
                    <td className="px-4 py-3 font-mono text-[10px] text-muted">{issue.nhiId.slice(0, 12)}…</td>
                    <td className="px-4 py-3 text-main">{issue.issueType.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3">
                      <Badge color={issue.severity === 'CRITICAL' ? 'red' : issue.severity === 'HIGH' ? 'amber' : 'cyan'}>
                        {issue.severity}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-muted">{formatRelativeTime(issue.detectedAt)}</td>
                    <td className="px-4 py-3">
                      <Badge color={issue.status === 'OPEN' ? 'red' : issue.status === 'ACKNOWLEDGED' ? 'amber' : 'green'}>
                        {issue.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="primary"
                        size="sm"
                        loading={remediate.isPending}
                        onClick={() => handleRemediate(issue.issueId)}
                      >
                        Remediate
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
