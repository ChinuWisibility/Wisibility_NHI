import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'

export default function RotationCenter() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Rotation Center"
        subtitle="Schedule and monitor credential rotations. View dependency graphs before rotating."
        breadcrumbs={[{ label: 'Security' }, { label: 'Rotation Center' }]}
      />
      <Card accent="amber">
        <CardHeader>Rotation Schedule</CardHeader>
        <p className="text-xs text-[#5a7a9a]">Connect to AWS backend to see rotation schedules and trigger manual rotations.</p>
      </Card>
    </div>
  )
}
