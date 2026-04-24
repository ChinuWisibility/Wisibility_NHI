import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'

export default function CertificationReview() {
  const { id } = useParams<{ id: string }>()
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Certification Review"
        subtitle="Review and submit CERTIFY / REVOKE / FLAG decisions for each NHI in this campaign."
        breadcrumbs={[{ label: 'Compliance', href: '/compliance/campaigns' }, { label: `Campaign ${id}` }]}
      />
      <Card accent="purple">
        <CardHeader>Decision Queue</CardHeader>
        <p className="text-xs text-[#5a7a9a]">Connect to AWS backend to see NHIs awaiting certification decision.</p>
      </Card>
    </div>
  )
}
