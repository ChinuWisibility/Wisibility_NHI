import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader } from '@/components/ui/Card'
import { ClipboardDocumentCheckIcon, ExclamationTriangleIcon, ShieldCheckIcon, UsersIcon } from '@heroicons/react/24/outline'

export default function ProgramDashboard() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Program Dashboard"
        subtitle="Lifecycle oversight, approval queue, policy alerts, and cross-team metrics."
        breadcrumbs={[{ label: 'Program Manager' }, { label: 'Dashboard' }]}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Pending Approvals" value="—" sub="NHI requests awaiting decision" icon={<ClipboardDocumentCheckIcon className="w-5 h-5" />} accent="amber" />
        <StatCard label="Active Campaigns"  value="—" sub="Certification campaigns"        icon={<ShieldCheckIcon className="w-5 h-5" />}             accent="cyan" />
        <StatCard label="Policy Violations" value="—" sub="Lifecycle policy breaches"      icon={<ExclamationTriangleIcon className="w-5 h-5" />}    accent="red" />
        <StatCard label="Teams Onboarded"   value="—" sub="Claiming NHI ownership"         icon={<UsersIcon className="w-5 h-5" />}                   accent="green" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card accent="amber">
          <CardHeader>Approval Queue</CardHeader>
          <p className="text-xs text-[#5a7a9a]">Connect to AWS backend to see pending NHI requests.</p>
        </Card>
        <Card accent="cyan">
          <CardHeader>Lifecycle Metrics</CardHeader>
          <p className="text-xs text-[#5a7a9a]">Connect to AWS backend to see lifecycle stage distribution.</p>
        </Card>
      </div>
    </div>
  )
}
