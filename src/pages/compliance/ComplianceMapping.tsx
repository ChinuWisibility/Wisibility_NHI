import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { useQuery } from '@tanstack/react-query'
import { complianceService } from '@/services/compliance.service'
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline'

export default function ComplianceMapping() {
  const { data } = useQuery({
    queryKey: ['compliance-scores'],
    queryFn:  () => complianceService.getScores(),
  })

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Compliance Mapping"
        subtitle="NHI control coverage mapped to SOX, PCI DSS v4, DORA, ISO 27001, and SOC 2."
        breadcrumbs={[{ label: 'Compliance' }, { label: 'Mapping' }]}
      />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {data ? data.map((fw) => (
          <StatCard
            key={fw.framework}
            label={fw.framework.replace(/_/g, ' ')}
            value={`${fw.score}%`}
            sub={`${fw.passing}/${fw.controls} controls`}
            icon={<ClipboardDocumentCheckIcon className="w-5 h-5" />}
            accent={fw.score > 80 ? 'green' : fw.score > 60 ? 'amber' : 'red'}
          />
        )) : (
          ['SOX', 'PCI DSS', 'DORA', 'ISO 27001', 'SOC 2'].map((fw) => (
            <StatCard key={fw} label={fw} value="—%" sub="Loading…" icon={<ClipboardDocumentCheckIcon className="w-5 h-5" />} accent="cyan" />
          ))
        )}
      </div>
      <Card accent="purple">
        <CardHeader>Control × Framework Matrix</CardHeader>
        <p className="text-xs text-muted">Connect to AWS backend to see the full control mapping matrix.</p>
      </Card>
    </div>
  )
}
