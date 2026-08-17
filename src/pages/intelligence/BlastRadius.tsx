import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { BRANDING } from '@/constants/branding'

const REACH = [
  { label: 'Applications', value: 5 },
  { label: 'Resources', value: 17 },
  { label: 'Databases', value: 3 },
  { label: 'Production servers', value: 2 },
  { label: 'Financial data stores', value: 1 },
]

const DATA = [
  { label: 'Critical', value: 2, color: 'bg-red-600' },
  { label: 'Confidential', value: 7, color: 'bg-orange-500' },
  { label: 'Internal', value: 8, color: 'bg-blue-500' },
]

const PATH = [
  'Compromised API key',
  'Service account SAP-FIN-PROD',
  'Production Kubernetes pod',
  'AWS role finance-prod-role',
  'S3 + SAP Finance data',
]

export default function BlastRadius() {
  return (
    <div className="animate-fade-up max-w-5xl">
      <PageHeader
        title="Blast Radius Analysis"
        subtitle="If this NHI is compromised, what can an attacker reach?"
        breadcrumbs={[{ label: BRANDING.product }, { label: 'Intelligence' }, { label: 'Blast Radius' }]}
        actions={
          <Link to="/inventory">
            <Button variant="secondary" size="sm">Open identity profile</Button>
          </Link>
        }
      />

      <Card className="mb-4 border-red-200 bg-red-50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-red-700 mb-1">Compromise impact</p>
            <p className="text-xl font-extrabold text-slate-900">FIN-SAP-PROD</p>
            <p className="text-sm text-slate-600 mt-1">Service account · Production · SAP Finance</p>
          </div>
          <Badge color="red">Potential impact · Critical</Badge>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {REACH.map((r) => (
          <Card key={r.label} className="text-center">
            <p className="text-2xl font-extrabold text-slate-900">{r.value}</p>
            <p className="text-xs font-semibold text-slate-600 mt-1">{r.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-4">Data classification reached</p>
          <div className="space-y-3">
            {DATA.map((d) => (
              <div key={d.label} className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${d.color}`} />
                <span className="flex-1 text-sm font-semibold text-slate-800">{d.label}</span>
                <span className="text-sm font-extrabold text-slate-900">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-4">Illustrative attack path</p>
          <ol className="space-y-2">
            {PATH.map((step, i) => (
              <li key={step} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 text-brand text-xs font-extrabold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-slate-800 pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  )
}
