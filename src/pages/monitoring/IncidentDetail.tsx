import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>()
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Incident Detail"
        subtitle="Forensic timeline and response action log."
        breadcrumbs={[{ label: 'Monitoring', href: '/monitoring/alerts' }, { label: `Incident ${id}` }]}
      />
      <Card accent="red">
        <CardHeader>Incident Timeline</CardHeader>
        <p className="text-xs text-[#5a7a9a]">Connect to AWS backend to see incident details.</p>
      </Card>
    </div>
  )
}
