import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'

export default function IssueDetail() {
  const { id } = useParams<{ id: string }>()
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Issue Detail"
        subtitle={`Posture issue ${id}`}
        breadcrumbs={[{ label: 'Posture', href: '/posture' }, { label: 'Issues', href: '/posture/issues' }, { label: id ?? '' }]}
      />
      <Card accent="amber">
        <CardHeader>Issue Details</CardHeader>
        <p className="text-xs text-[#5a7a9a]">Connect to AWS backend to see issue details.</p>
      </Card>
    </div>
  )
}
