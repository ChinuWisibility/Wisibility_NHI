import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useQuery } from '@tanstack/react-query'
import { complianceService } from '@/services/compliance.service'
import { formatDate } from '@/utils/formatters'

export default function CertificationCampaigns() {
  const { data, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn:  () => complianceService.listCampaigns(),
  })

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Certification Campaigns"
        subtitle="Launch and manage NHI certification campaigns for regulatory compliance."
        breadcrumbs={[{ label: 'Compliance' }, { label: 'Campaigns' }]}
        actions={<Button variant="primary" size="sm">+ New Campaign</Button>}
      />
      {isLoading && <div className="flex justify-center py-16"><Spinner size="lg" /></div>}
      {data && data.length === 0 && (
        <Card accent="purple">
          <CardHeader>No campaigns</CardHeader>
          <p className="text-xs text-[#5a7a9a]">Create a certification campaign to begin the review process.</p>
        </Card>
      )}
      {data && data.length > 0 && (
        <div className="space-y-3">
          {data.map((c) => (
            <Card key={c.campaignId} accent="purple">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#e2eeff] font-medium">{c.name}</p>
                  <p className="font-mono text-[10px] text-[#5a7a9a] mt-0.5">
                    {c.framework.replace(/_/g, ' ')} · Due {formatDate(c.dueDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={c.status === 'ACTIVE' ? 'green' : c.status === 'CLOSED' ? 'dim' : 'amber'}>
                    {c.status}
                  </Badge>
                  <a
                    href={`/compliance/campaigns/${c.campaignId}`}
                    className="font-mono text-[10px] px-3 py-1.5 rounded border border-cyber-cyan/40 bg-cyber-cyan/10 text-cyber-cyan hover:bg-cyber-cyan/20 transition-colors"
                  >
                    Review →
                  </a>
                </div>
              </div>
              <div className="flex gap-4 mt-3 text-xs text-[#5a7a9a]">
                <span>{c.decisions} decisions made</span>
                <span>{c.pending} pending</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
