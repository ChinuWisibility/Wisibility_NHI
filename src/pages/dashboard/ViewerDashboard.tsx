import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader } from '@/components/ui/Card'
import { MagnifyingGlassIcon, ShieldCheckIcon, BellAlertIcon, KeyIcon } from '@heroicons/react/24/outline'

export default function ViewerDashboard() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Viewer Dashboard"
        subtitle="Read-only summary of the NHI governance platform."
        breadcrumbs={[{ label: 'Viewer' }, { label: 'Dashboard' }]}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total NHIs"     value="—" sub="Across all environments"  icon={<KeyIcon className="w-5 h-5" />}              accent="cyan" />
        <StatCard label="Posture Score"  value="—" sub="Overall health"           icon={<ShieldCheckIcon className="w-5 h-5" />}      accent="green" />
        <StatCard label="Open Alerts"    value="—" sub="All severities"           icon={<BellAlertIcon className="w-5 h-5" />}        accent="amber" />
        <StatCard label="Connectors"     value="—" sub="Active integrations"      icon={<MagnifyingGlassIcon className="w-5 h-5" />}  accent="purple" />
      </div>
      <Card accent="cyan">
        <CardHeader>Platform Summary</CardHeader>
        <p className="text-xs text-[#5a7a9a]">
          You have read-only access. Contact your Platform Manager or Security Analyst to request elevated access.
        </p>
      </Card>
    </div>
  )
}
