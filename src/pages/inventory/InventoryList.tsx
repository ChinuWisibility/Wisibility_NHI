import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { useNHIList } from '@/hooks/useNHI'
import { useNHIStore } from '@/stores/nhiStore'
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch'
import { formatRelativeTime, riskLevelBg } from '@/utils/formatters'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import type { NHI, NHIType } from '@/types/nhi.types'
import { cn } from '@/utils/cn'

const TYPE_TABS: { label: string; value: NHIType | '' }[] = [
  { label: 'All NHIs', value: '' },
  { label: 'Service Accounts', value: 'SERVICE_ACCOUNT' },
  { label: 'Machine Identities', value: 'IAM_ROLE' },
  { label: 'API Keys', value: 'API_KEY' },
  { label: 'Tokens', value: 'LONG_LIVED_TOKEN' },
  { label: 'Certificates', value: 'CERTIFICATE' },
  { label: 'Secrets', value: 'WEBHOOK_SECRET' },
  { label: 'Workloads', value: 'SPIFFE_SVID' },
]

export default function InventoryList() {
  const [search, setSearch]  = useState('')
  const debounced            = useDebouncedSearch(search)
  const setFilters           = useNHIStore((s) => s.setFilters)
  const { data, isLoading, isError } = useNHIList()
  const navigate             = useNavigate()
  const [params, setParams]  = useSearchParams()
  const typeFilter           = (params.get('type') ?? '') as NHIType | ''

  useEffect(() => {
    setFilters({
      q: debounced || undefined,
      nhiType: typeFilter || undefined,
    })
  }, [debounced, typeFilter, setFilters])

  const setType = (value: NHIType | '') => {
    const next = new URLSearchParams(params)
    if (value) next.set('type', value)
    else next.delete('type')
    setParams(next, { replace: true })
  }

  const activeLabel = TYPE_TABS.find((t) => t.value === typeFilter)?.label ?? 'All NHIs'

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={activeLabel === 'All NHIs' ? 'NHI Inventory' : activeLabel}
        subtitle="Unified catalogue of machine users, credentials, workloads and agents across connected systems."
        breadcrumbs={[{ label: 'Inventory' }, { label: activeLabel }]}
        actions={<Button variant="primary" size="sm">Export</Button>}
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setType(tab.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors',
              typeFilter === tab.value
                ? 'bg-blue-50 border-blue-300 text-blue-800'
                : 'bg-white border-slate-300 text-slate-600 hover:border-blue-300',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name, ID, owner…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card padding={false}>
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        )}
        {isError && (
          <EmptyState
            icon={<MagnifyingGlassIcon className="w-10 h-10" />}
            title="Failed to load inventory"
            message="Check your API connection and try again."
          />
        )}
        {data && data.items.length === 0 && (
          <EmptyState
            icon={<MagnifyingGlassIcon className="w-10 h-10" />}
            title="No NHIs found"
            message="Run a discovery scan to populate the inventory."
          />
        )}
        {data && data.items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-surface-2 border-b border-surface-border">
                  {['Display Name', 'Type', 'Risk', 'Environment', 'Owner', 'Connector', 'Last Seen'].map((h) => (
                    <th key={h} className="font-mono text-[10px] tracking-widest uppercase text-slate-600 px-4 py-3 text-left whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((nhi: NHI) => (
                  <tr
                    key={nhi.nhiId}
                    className="border-b border-surface-border hover:bg-cyber-cyan/5 cursor-pointer transition-colors"
                    onClick={() => navigate(`/inventory/${nhi.nhiId}`)}
                  >
                    <td className="px-4 py-3 text-bright font-medium">{nhi.displayName}</td>
                    <td className="px-4 py-3">
                      <Badge color="dim">{nhi.nhiType.replace(/_/g, ' ')}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded border ${riskLevelBg(nhi.riskLevel)}`}>
                        {nhi.riskLevel} · {nhi.riskScore}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-muted">{nhi.environment}</td>
                    <td className="px-4 py-3 text-main">{nhi.ownerTeam ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge color="cyan">{nhi.sourceConnector}</Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-muted">{formatRelativeTime(nhi.lastDiscovered)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && (
          <div className="px-4 py-3 border-t border-surface-border flex items-center justify-between">
            <p className="font-mono text-[10px] text-muted">
              {data.total} total NHIs · Page {data.page} of {data.totalPages}
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
