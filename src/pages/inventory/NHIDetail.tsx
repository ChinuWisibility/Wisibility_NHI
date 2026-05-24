import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { useNHIDetail } from '@/hooks/useNHI'
import { formatDate, formatCredentialAge, riskLevelBg } from '@/utils/formatters'

export default function NHIDetail() {
  const { id }              = useParams<{ id: string }>()
  const { data, isLoading } = useNHIDetail(id ?? '')

  if (isLoading) return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
  if (!data) return <p className="text-xs text-muted p-6">NHI not found.</p>

  return (
    <div className="animate-fade-up max-w-5xl">
      <PageHeader
        title={data.displayName}
        subtitle={`${data.nhiType.replace(/_/g, ' ')} · ${data.environment}`}
        breadcrumbs={[{ label: 'Inventory', href: '/inventory' }, { label: data.displayName }]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Risk score */}
        <Card accent="cyan" className="lg:col-span-1">
          <CardHeader>Risk Score</CardHeader>
          <p className={`font-display text-4xl font-bold mb-2 ${riskLevelBg(data.riskLevel).split(' ')[0]}`}>
            {data.riskScore}
          </p>
          <span className={`font-mono text-[10px] px-2 py-0.5 rounded border ${riskLevelBg(data.riskLevel)}`}>
            {data.riskLevel}
          </span>
        </Card>
        {/* Meta */}
        <Card accent="none" className="lg:col-span-2">
          <CardHeader>Identity Details</CardHeader>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
            {[
              { label: 'NHI ID',      value: data.nhiId },
              { label: 'Type',        value: data.nhiType },
              { label: 'Status',      value: data.status },
              { label: 'Environment', value: data.environment },
              { label: 'Privilege',   value: data.privilegeLevel },
              { label: 'Owner Team',  value: data.ownerTeam ?? '—' },
              { label: 'Is Shared',   value: data.isShared ? 'Yes' : 'No' },
              { label: 'Is Hardcoded', value: data.isHardcoded ? 'Yes' : 'No' },
              { label: 'Created',     value: formatDate(data.createdAt) },
              { label: 'Age',         value: formatCredentialAge(data.createdAt) },
              { label: 'Vault Path',  value: data.vaultPath ?? '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="font-mono text-[9px] uppercase tracking-wider text-muted">{label}</dt>
                <dd className="text-main mt-0.5 truncate">{String(value)}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Connector Details */}
        <Card accent="cyan">
          <CardHeader>Connector Information</CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-surface-2 border border-surface-border rounded flex items-center justify-center font-bold text-cyber-cyan">
              {data.sourceConnector.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-bright">{data.sourceConnector}</p>
              <p className="font-mono text-[9px] text-muted mt-1 uppercase tracking-wider">Source System</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-surface-border grid grid-cols-2 gap-4">
            <div>
              <p className="font-mono text-[8px] text-muted uppercase mb-1">Last Discovered</p>
              <p className="text-[11px] text-main">{formatDate(data.lastDiscovered)}</p>
            </div>
            <div>
              <p className="font-mono text-[8px] text-muted uppercase mb-1">Discovery Status</p>
              <Badge color="green">SUCCESS</Badge>
            </div>
          </div>
        </Card>

        {/* Tags */}
        {Object.keys(data.tags).length > 0 && (
          <Card>
            <CardHeader>Metadata Tags</CardHeader>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.tags).map(([k, v]) => (
                <Badge key={k} color="dim">{k}: {v}</Badge>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
