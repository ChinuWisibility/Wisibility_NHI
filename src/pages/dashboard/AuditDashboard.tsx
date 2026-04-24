import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader } from '@/components/ui/Card'
import { ClipboardDocumentCheckIcon, DocumentArrowDownIcon, ShieldCheckIcon, FlagIcon } from '@heroicons/react/24/outline'

export default function AuditDashboard() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Audit & Compliance Dashboard"
        subtitle="Compliance scores, upcoming certification campaigns, and evidence exports."
        breadcrumbs={[{ label: 'Audit' }, { label: 'Dashboard' }]}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="SOX Compliance"   value="—%" sub="Control coverage"   icon={<ClipboardDocumentCheckIcon className="w-5 h-5" />} accent="cyan" />
        <StatCard label="PCI DSS"          value="—%" sub="v4 compliance"      icon={<ShieldCheckIcon className="w-5 h-5" />}             accent="green" />
        <StatCard label="DORA"             value="—%" sub="Compliance score"   icon={<FlagIcon className="w-5 h-5" />}                   accent="amber" />
        <StatCard label="Pending Certs"    value="—"  sub="Awaiting decision"  icon={<DocumentArrowDownIcon className="w-5 h-5" />}      accent="purple" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card accent="purple">
          <CardHeader>Active Campaigns</CardHeader>
          <p className="text-xs text-[#5a7a9a]">Connect to AWS backend to see active certification campaigns.</p>
        </Card>
        <Card accent="cyan">
          <CardHeader>Export Evidence</CardHeader>
          <div className="space-y-2">
            {['SOX', 'PCI DSS v4', 'DORA', 'ISO 27001', 'SOC 2'].map((fw) => (
              <div key={fw} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                <span className="text-xs text-[#b8cfe6]">{fw}</span>
                <a href="/compliance/export" className="font-mono text-[10px] text-cyber-cyan hover:underline">Export PDF →</a>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
