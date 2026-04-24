import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'

export default function DiscoveryDetail() {
  const { id } = useParams<{ id: string }>()
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Discovery Run Detail"
        subtitle={`Details for run ${id}`}
        breadcrumbs={[{ label: 'Discovery', href: '/discovery/runs' }, { label: id ?? '' }]}
      />
      <Card accent="cyan">
        <CardHeader>Run Details</CardHeader>
        <p className="text-xs text-[#5a7a9a]">Connect to AWS backend to see full run details.</p>
      </Card>
    </div>
  )
}
