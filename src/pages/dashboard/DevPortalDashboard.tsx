import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { KeyIcon, ArrowPathIcon, DocumentTextIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

export default function DevPortalDashboard() {
  const navigate = useNavigate()
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Developer Portal"
        subtitle="Your NHIs, pending requests, vault SDK guide, and rotation status."
        breadcrumbs={[{ label: 'Dev Portal' }, { label: 'Dashboard' }]}
        actions={
          <Button variant="primary" onClick={() => navigate('/dev/request')}>
            + Request NHI
          </Button>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="My NHIs"           value="—" sub="Owned by you"                   icon={<KeyIcon className="w-5 h-5" />}          accent="cyan" />
        <StatCard label="Pending Requests"  value="—" sub="Awaiting approval"              icon={<DocumentTextIcon className="w-5 h-5" />} accent="amber" />
        <StatCard label="Due for Rotation"  value="—" sub="Next 7 days"                    icon={<ArrowPathIcon className="w-5 h-5" />}    accent="red" />
        <StatCard label="Vault Onboarded"   value="—" sub="Secrets in vault"               icon={<ShieldCheckIcon className="w-5 h-5" />}  accent="green" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card accent="cyan">
          <CardHeader>Vault SDK Quick Start</CardHeader>
          <div className="space-y-3 text-xs text-[#b8cfe6]">
            <p className="text-[#5a7a9a]">Use the vault SDK to inject credentials into your service at runtime. Never hardcode secrets.</p>
            {[
              '1. Request an NHI via this portal',
              '2. Approved NHI credentials stored in vault',
              '3. Use SDK: vault.getSecret(nhiId)',
              '4. Credentials auto-rotate on schedule',
            ].map((step) => (
              <p key={step} className="font-mono text-[10px]">{step}</p>
            ))}
          </div>
        </Card>
        <Card accent="amber">
          <CardHeader>Recent Activity</CardHeader>
          <p className="text-xs text-[#5a7a9a]">Connect to AWS backend to see your recent NHI activity.</p>
        </Card>
      </div>
    </div>
  )
}
