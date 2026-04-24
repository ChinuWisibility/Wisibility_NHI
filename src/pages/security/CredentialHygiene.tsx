import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'

export default function CredentialHygiene() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Credential Hygiene"
        subtitle="Identify and remediate hardcoded, shared, and stale credentials."
        breadcrumbs={[{ label: 'Security' }, { label: 'Credential Hygiene' }]}
      />
      <Card accent="red">
        <CardHeader>Hygiene Issues</CardHeader>
        <p className="text-xs text-[#5a7a9a]">Connect to AWS backend to see credential hygiene issues.</p>
      </Card>
    </div>
  )
}
