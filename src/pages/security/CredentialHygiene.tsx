import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { ExclamationTriangleIcon, LinkIcon, ShareIcon, LockOpenIcon, UserIcon } from '@heroicons/react/24/outline'
import { securityService } from '@/services/security.service'
import type { NHI } from '@/types/nhi.types'

const SEV_COLOR: Record<string, 'red'|'amber'|'cyan'|'green'> = {
  CRITICAL: 'red', HIGH: 'amber', MEDIUM: 'cyan', LOW: 'green',
}

type ActiveTab = 'hardcoded' | 'shared' | 'noVault'
const TABS: { key: ActiveTab; label: string }[] = [
  { key: 'hardcoded', label: 'Hardcoded' },
  { key: 'shared',    label: 'Shared' },
  { key: 'noVault',   label: 'Not in Vault' },
]

export default function CredentialHygiene() {
  const [tab, setTab] = useState<ActiveTab>('hardcoded')

  const { data, isLoading } = useQuery({
    queryKey: ['security-hygiene'],
    queryFn:  securityService.getHygiene,
  })

  const nhiList: NHI[] = data ? (data.nhis[tab] as unknown as NHI[]) : []

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Credential Hygiene"
        subtitle="Identify and remediate hardcoded, shared, and vault-less credentials."
        breadcrumbs={[{ label: 'Security' }, { label: 'Credential Hygiene' }]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="Hardcoded"   value={data?.hardcoded ?? '—'} sub="Credentials in code"    icon={<LinkIcon className="w-5 h-5" />}              accent={data?.hardcoded ? 'red' : 'green'} />
        <StatCard label="Shared"      value={data?.shared    ?? '—'} sub="Multiple users/services" icon={<ShareIcon className="w-5 h-5" />}            accent={data?.shared ? 'amber' : 'green'} />
        <StatCard label="Not in Vault" value={data?.noVault  ?? '—'} sub="Unmanaged active NHIs"  icon={<LockOpenIcon className="w-5 h-5" />}          accent={data?.noVault ? 'amber' : 'green'} />
        <StatCard label="No Owner"    value={data?.noOwner   ?? '—'} sub="Unassigned identity"    icon={<UserIcon className="w-5 h-5" />}              accent={data?.noOwner ? 'cyan' : 'green'} />
        <StatCard label="Stale (90d)" value={data?.stale90   ?? '—'} sub="No activity in 90 days" icon={<ExclamationTriangleIcon className="w-5 h-5" />} accent={data?.stale90 ? 'amber' : 'green'} />
      </div>

      {isLoading && <div className="flex justify-center py-12"><Spinner size="lg" /></div>}

      {data && (
        <div className="space-y-4">
          <Card>
            <CardHeader>Issue Breakdown</CardHeader>
            <div className="space-y-3">
              {data.byCategory.map((cat) => (
                <div key={cat.label} className="flex items-center gap-3">
                  <Badge color={SEV_COLOR[cat.severity]}>{cat.severity}</Badge>
                  <span className="text-xs text-main flex-1">{cat.label}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-40 h-2 bg-surface-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${cat.severity === 'CRITICAL' ? 'bg-cyber-red' : cat.severity === 'HIGH' ? 'bg-amber-400' : 'bg-cyber-cyan'}`}
                        style={{ width: `${Math.min(100, Math.round((cat.count / data.total) * 100 * 4))}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs text-main w-12 text-right">{cat.count.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card padding={false}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-border bg-surface-2">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`font-mono text-[10px] px-3 py-1.5 rounded border transition-colors ${
                    tab === t.key
                      ? 'bg-cyber-cyan/15 border-cyber-cyan text-cyber-cyan'
                      : 'border-surface-border text-muted hover:border-cyber-cyan/50'
                  }`}
                >
                  {t.label}
                  <span className="ml-1.5 font-bold">
                    {t.key === 'hardcoded' ? data.hardcoded : t.key === 'shared' ? data.shared : data.noVault}
                  </span>
                </button>
              ))}
              <span className="ml-auto text-[10px] text-muted font-mono">Top 10 shown</span>
            </div>

            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-surface-border">
                  {['Identity','Type','Risk','Environment','Owner Team','Vault Path'].map((h) => (
                    <th key={h} className="font-mono text-[10px] tracking-widest uppercase text-slate-600 px-4 py-3 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {nhiList.map((n) => (
                  <tr key={n.nhiId} className="border-b border-surface-border hover:bg-cyber-cyan/5 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/inventory/${n.nhiId}`} className="text-bright hover:text-cyber-cyan transition-colors font-medium">
                        {n.displayName}
                      </Link>
                    </td>
                    <td className="px-4 py-3"><Badge color="cyan">{n.nhiType.replace(/_/g,' ')}</Badge></td>
                    <td className="px-4 py-3"><Badge color={SEV_COLOR[n.riskLevel]}>{n.riskLevel}</Badge></td>
                    <td className="px-4 py-3 text-main">{n.environment}</td>
                    <td className="px-4 py-3 text-main">{n.ownerTeam ?? <span className="text-muted">—</span>}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-muted">{n.vaultPath ?? <span className="text-cyber-red">None</span>}</td>
                  </tr>
                ))}
                {nhiList.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-10 text-muted">No issues in this category.</td></tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  )
}
