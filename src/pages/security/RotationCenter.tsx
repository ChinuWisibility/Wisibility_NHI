import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { ArrowPathIcon, ExclamationTriangleIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { securityService } from '@/services/security.service'
import type { RotationJob } from '@/services/security.service'

const STATUS_COLOR: Record<RotationJob['status'], 'red'|'amber'|'green'> = {
  OVERDUE: 'red', DUE_SOON: 'amber', SCHEDULED: 'green',
}
const ENV_COLOR: Record<string, 'red'|'amber'|'cyan'|'green'> = {
  PROD: 'red', STAGING: 'amber', DEV: 'cyan', TEST: 'green',
}

export default function RotationCenter() {
  const { data, isLoading } = useQuery({
    queryKey: ['security-rotation'],
    queryFn:  securityService.getRotation,
  })

  const [filter, setFilter] = useState<'ALL'|'OVERDUE'|'DUE_SOON'|'SCHEDULED'>('ALL')

  const visible = data?.jobs.filter((j) => filter === 'ALL' || j.status === filter) ?? []

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Rotation Center"
        subtitle="Schedule and monitor credential rotations across all environments."
        breadcrumbs={[{ label: 'Security' }, { label: 'Rotation Center' }]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="On Schedule"  value={data ? (data.total - data.overdue - data.dueSoon) : '—'} sub="Next rotation >7 days"  icon={<CheckCircleIcon className="w-5 h-5" />}       accent="green" />
        <StatCard label="Due Soon"     value={data?.dueSoon  ?? '—'}                                    sub="Within 7 days"         icon={<ClockIcon className="w-5 h-5" />}              accent="amber" />
        <StatCard label="Overdue"      value={data?.overdue  ?? '—'}                                    sub="Past rotation date"    icon={<ExclamationTriangleIcon className="w-5 h-5" />} accent={data?.overdue ? 'red' : 'green'} />
        <StatCard label="Total Managed" value={data?.total   ?? '—'}                                    sub="With rotation schedule" icon={<ArrowPathIcon className="w-5 h-5" />}         accent="cyan" />
      </div>

      <div className="flex gap-2 mb-4">
        {(['ALL','OVERDUE','DUE_SOON','SCHEDULED'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`font-mono text-[10px] px-3 py-1.5 rounded border transition-colors ${
              filter === f
                ? 'bg-cyber-cyan/15 border-cyber-cyan text-cyber-cyan'
                : 'bg-surface-2 border-surface-border text-muted hover:border-cyber-cyan/50'
            }`}
          >
            {f.replace('_',' ')}
            {data && f !== 'ALL' && (
              <span className="ml-1.5 font-bold">
                {f === 'OVERDUE' ? data.overdue : f === 'DUE_SOON' ? data.dueSoon : data.total - data.overdue - data.dueSoon}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading && <div className="flex justify-center py-12"><Spinner size="lg" /></div>}

      {data && (
        <Card padding={false}>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-surface-2 border-b border-surface-border">
                {['Identity','Type','Environment','Owner','Schedule','Last Rotated','Next Rotation','Status'].map((h) => (
                  <th key={h} className="font-mono text-[10px] tracking-widest uppercase text-slate-600 px-4 py-3 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((job) => (
                <tr key={job.nhiId} className="border-b border-surface-border hover:bg-cyber-cyan/5 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/inventory/${job.nhiId}`} className="text-bright hover:text-cyber-cyan transition-colors font-medium truncate max-w-[160px] block">
                      {job.nhiName}
                    </Link>
                  </td>
                  <td className="px-4 py-3"><Badge color="cyan">{job.nhiType.replace('_',' ')}</Badge></td>
                  <td className="px-4 py-3"><Badge color={ENV_COLOR[job.environment]}>{job.environment}</Badge></td>
                  <td className="px-4 py-3 text-main">{job.ownerTeam}</td>
                  <td className="px-4 py-3 font-mono text-cyber-cyan">{job.schedule}</td>
                  <td className="px-4 py-3 text-muted">{new Date(job.lastRotatedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-main">
                    {job.daysUntil < 0
                      ? <span className="text-cyber-red">{Math.abs(job.daysUntil)}d ago</span>
                      : `in ${job.daysUntil}d`}
                  </td>
                  <td className="px-4 py-3"><Badge color={STATUS_COLOR[job.status]}>{job.status.replace('_',' ')}</Badge></td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-muted">No rotation jobs match this filter.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}

