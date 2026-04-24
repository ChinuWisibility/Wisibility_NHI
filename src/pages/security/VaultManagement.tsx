import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'

export default function VaultManagement() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Vault Management"
        subtitle="Configure and monitor HashiCorp Vault, CyberArk, and AWS Secrets Manager integrations."
        breadcrumbs={[{ label: 'Security' }, { label: 'Vault Management' }]}
      />
      <Card accent="cyan">
        <CardHeader>Vault Integrations</CardHeader>
        <p className="text-xs text-[#5a7a9a]">Connect to AWS backend to manage vault integrations.</p>
      </Card>
    </div>
  )
}
