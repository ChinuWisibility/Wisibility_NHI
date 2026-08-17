import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { nhiService } from '@/services/nhi.service'
import { BRANDING } from '@/constants/branding'
import {
  ShieldExclamationIcon, UserMinusIcon, KeyIcon, ClockIcon,
  ExclamationTriangleIcon, ArrowRightIcon,
} from '@heroicons/react/24/outline'

const SHOWCASE = {
  total: 48921,
  critical: 327,
  orphaned: 1842,
  overprivileged: 4128,
  byRisk: { CRITICAL: 327, HIGH: 1840, MEDIUM: 12650, LOW: 34104 },
}

const TOP_RISKS = [
  { severity: 'critical' as const, text: '127 production NHIs have no owner', href: '/risk/orphaned' },
  { severity: 'critical' as const, text: '84 privileged credentials older than 180 days', href: '/risk/expiring' },
  { severity: 'critical' as const, text: '42 secrets discovered outside approved vaults', href: '/security/hygiene' },
  { severity: 'high' as const, text: '1,284 dormant service accounts', href: '/risk/dormant' },
  { severity: 'high' as const, text: '326 NHIs have excessive permissions', href: '/security/hygiene' },
]

export default function CommandCenter() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['nhi-summary'],
    queryFn: nhiService.getSummary,
  })

  const total = summary?.total ?? SHOWCASE.total
  const critical = summary?.byRisk?.CRITICAL ?? SHOWCASE.critical
  const orphaned = summary?.byStatus?.DORMANT ?? SHOWCASE.orphaned
  const overprivileged = summary?.shared ?? SHOWCASE.overprivileged
  const risk = {
    CRITICAL: summary?.byRisk?.CRITICAL ?? SHOWCASE.byRisk.CRITICAL,
    HIGH:     summary?.byRisk?.HIGH ?? SHOWCASE.byRisk.HIGH,
    MEDIUM:   summary?.byRisk?.MEDIUM ?? SHOWCASE.byRisk.MEDIUM,
    LOW:      summary?.byRisk?.LOW ?? SHOWCASE.byRisk.LOW,
  }
  const maxRisk = Math.max(risk.CRITICAL, risk.HIGH, risk.MEDIUM, risk.LOW, 1)

  const kpis = [
    { label: 'NHIs', value: total.toLocaleString(), sub: 'Discovered identities', href: '/inventory', accent: 'text-slate-900' },
    { label: 'Critical', value: critical.toLocaleString(), sub: 'Require immediate action', href: '/posture/issues', accent: 'text-red-700' },
    { label: 'Orphaned', value: orphaned.toLocaleString(), sub: 'No identifiable owner', href: '/risk/orphaned', accent: 'text-amber-700' },
    { label: 'Overprivileged', value: overprivileged.toLocaleString(), sub: 'Excess standing access', href: '/security/hygiene', accent: 'text-orange-700' },
  ]

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="NHI Security Command Center"
        subtitle={`${BRANDING.taglineLong}`}
        breadcrumbs={[{ label: BRANDING.product }, { label: 'Command Center' }]}
        actions={
          <div className="flex gap-2">
            <Link to="/intelligence/graph"><Button variant="secondary" size="sm">Identity Graph</Button></Link>
            <Link to="/inventory"><Button variant="primary" size="sm">Open Inventory</Button></Link>
          </div>
        }
      />

      {isLoading && !summary && (
        <div className="flex justify-center py-8"><Spinner /></div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => (
          <Link key={k.label} to={k.href}>
            <Card className="hover:border-blue-300 transition-colors h-full">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">{k.label}</p>
              <p className={`text-3xl font-extrabold tracking-tight ${k.accent}`}>{k.value}</p>
              <p className="text-sm text-slate-600 mt-1">{k.sub}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-4">NHI Risk Distribution</p>
          <div className="space-y-3">
            {([
              { key: 'CRITICAL', color: 'bg-red-600', label: 'Critical' },
              { key: 'HIGH', color: 'bg-orange-500', label: 'High' },
              { key: 'MEDIUM', color: 'bg-amber-400', label: 'Medium' },
              { key: 'LOW', color: 'bg-blue-600', label: 'Low' },
            ] as const).map((row) => (
              <div key={row.key} className="flex items-center gap-3">
                <span className="w-20 text-sm font-semibold text-slate-700">{row.label}</span>
                <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                  <div
                    className={`h-full rounded-full ${row.color}`}
                    style={{ width: `${Math.max(4, (risk[row.key] / maxRisk) * 100)}%` }}
                  />
                </div>
                <span className="w-16 text-right text-sm font-bold text-slate-800">
                  {risk[row.key].toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-4">Remediation</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Auto-remediable', value: '642', href: '/remediation/recommendations' },
              { label: 'Awaiting approval', value: '183', href: '/remediation/workflows' },
              { label: 'Manual', value: '92', href: '/remediation/workflows' },
              { label: 'SLA breached', value: '27', href: '/remediation/workflows' },
            ].map((item) => (
              <Link key={item.label} to={item.href} className="rounded-xl border border-slate-200 bg-slate-50 p-3 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <p className="text-xl font-extrabold text-slate-900">{item.value}</p>
                <p className="text-[11px] font-semibold text-slate-600 mt-1">{item.label}</p>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Top Risks</p>
          <Link to="/posture/issues" className="text-sm font-bold text-brand hover:underline inline-flex items-center gap-1">
            All findings <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>
        <ul className="divide-y divide-slate-200">
          {TOP_RISKS.map((r) => (
            <li key={r.text}>
              <Link to={r.href} className="flex items-center gap-3 py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${r.severity === 'critical' ? 'bg-red-600' : 'bg-orange-500'}`} />
                <span className="flex-1 text-sm font-medium text-slate-800">{r.text}</span>
                <Badge color={r.severity === 'critical' ? 'red' : 'amber'}>
                  {r.severity === 'critical' ? 'Critical' : 'High'}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { icon: ShieldExclamationIcon, label: 'Findings', href: '/posture/issues' },
          { icon: UserMinusIcon, label: 'Orphaned NHIs', href: '/risk/orphaned' },
          { icon: KeyIcon, label: 'Vault hygiene', href: '/security/hygiene' },
          { icon: ClockIcon, label: 'Expiring credentials', href: '/risk/expiring' },
          { icon: ExclamationTriangleIcon, label: 'Certifications', href: '/compliance/campaigns' },
        ].slice(0, 4).map((item) => (
          <Link key={item.label} to={item.href} className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <item.icon className="w-5 h-5 text-brand" />
            <span className="text-sm font-bold text-slate-800">{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {BRANDING.pillars.map((p) => (
          <div key={p.key} className="rounded-xl border border-slate-200 bg-white px-3 py-3">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-brand mb-1">{p.label}</p>
            <p className="text-[11px] text-slate-600 leading-snug">{p.blurb}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
