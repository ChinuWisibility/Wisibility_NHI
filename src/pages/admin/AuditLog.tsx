import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { useQuery } from '@tanstack/react-query'
import { auditService } from '@/services/audit.service'
import { formatDateTime } from '@/utils/formatters'
import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline'

export default function AuditLog() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', search],
    queryFn:  () => auditService.list({ actorId: search || undefined, limit: 50 }),
  })

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Audit Log"
        subtitle="Immutable audit trail of all platform actions. Searchable by resource, actor, action, and date."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Audit Log' }]}
      />
      <div className="mb-4">
        <Input
          placeholder="Search by actor ID, resource ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Card padding={false}>
        {isLoading && <div className="flex justify-center py-16"><Spinner size="lg" /></div>}
        {!isLoading && (!data || data.items.length === 0) && (
          <EmptyState
            icon={<DocumentMagnifyingGlassIcon className="w-10 h-10" />}
            title="No audit logs"
            message="Audit logs will appear here as platform actions are performed."
          />
        )}
        {data && data.items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-surface-2 border-b border-surface-border">
                  {['Timestamp', 'Actor', 'Role', 'Action', 'Resource Type', 'Resource ID'].map((h) => (
                    <th key={h} className="font-mono text-[10px] tracking-widest uppercase text-slate-600 px-4 py-3 text-left whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((log) => (
                  <tr key={log.eventId} className="border-b border-surface-border hover:bg-cyber-cyan/5 transition-colors">
                    <td className="px-4 py-3 font-mono text-[10px] text-muted">{formatDateTime(log.timestamp)}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-cyber-cyan">{log.actorId.slice(0, 10)}…</td>
                    <td className="px-4 py-3"><Badge color="dim">{log.actorRole}</Badge></td>
                    <td className="px-4 py-3 text-main">{log.action}</td>
                    <td className="px-4 py-3 text-muted">{log.resourceType}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-muted">{log.resourceId.slice(0, 12)}…</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
