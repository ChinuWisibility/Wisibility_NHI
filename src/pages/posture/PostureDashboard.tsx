import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { usePostureReport } from '@/hooks/usePosture'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'

export default function PostureDashboard() {
  const { data, isLoading } = usePostureReport()
  const navigate = useNavigate()

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Posture Dashboard"
        subtitle="Daily posture score, issue breakdown by category, and remediation progress."
        breadcrumbs={[{ label: 'Posture' }, { label: 'Dashboard' }]}
        actions={<Button variant="primary" size="sm" onClick={() => navigate('/posture/issues')}>View All Issues</Button>}
      />
      {isLoading && <div className="flex justify-center py-16"><Spinner size="lg" /></div>}
      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Posture Score"
              value={`${data.score}%`}
              sub={`${data.scoreDelta > 0 ? '+' : ''}${data.scoreDelta}% vs last week`}
              icon={<ShieldCheckIcon className="w-5 h-5" />}
              accent={data.score > 70 ? 'green' : data.score > 50 ? 'amber' : 'red'}
            />
            {Object.entries(data.issueCount).slice(0, 3).map(([cat, count]) => (
              <StatCard key={cat} label={cat.replace(/_/g, ' ')} value={count} sub="Open issues" accent={count > 0 ? 'amber' : 'green'} />
            ))}
          </div>
          <Card accent="cyan">
            <CardHeader>Issues by Category</CardHeader>
            <div className="space-y-2">
              {Object.entries(data.issueCount).map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                  <span className="text-xs text-[#b8cfe6]">{cat.replace(/_/g, ' ')}</span>
                  <Badge color={count > 0 ? 'amber' : 'green'}>{count}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
      {!isLoading && !data && (
        <Card accent="cyan">
          <CardHeader>Posture Data</CardHeader>
          <p className="text-xs text-[#5a7a9a]">Connect to AWS backend to see posture data.</p>
        </Card>
      )}
    </div>
  )
}
