import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { complianceService } from '@/services/compliance.service'
import type { NHI } from '@/types/nhi.types'
import type { CertificationDecision } from '@/types/compliance.types'
import toast from 'react-hot-toast'

type Decision = CertificationDecision | null

const RISK_COLOR: Record<string, 'red'|'amber'|'cyan'|'green'> = {
  CRITICAL: 'red', HIGH: 'amber', MEDIUM: 'cyan', LOW: 'green',
}

export default function CertificationReview() {
  const { id }  = useParams<{ id: string }>()
  const qc      = useQueryClient()
  const [decisions, setDecisions] = useState<Record<string, Decision>>({})

  const { data: campaign, isLoading, isError } = useQuery({
    queryKey: ['campaign', id],
    queryFn:  () => complianceService.getCampaignById(id!),
    enabled:  !!id,
  })

  const submit = useMutation({
    mutationFn: () => {
      const payload = Object.entries(decisions)
        .filter(([, d]) => d !== null)
        .map(([nhiId, decision]) => ({ 
          campaignId: id!,
          nhiId, 
          decision: decision!, 
          justification: 'Reviewed via portal' 
        }))
      return complianceService.submitDecisions(id!, payload)
    },
    onSuccess: () => {
      toast.success('Decisions submitted')
      qc.invalidateQueries({ queryKey: ['campaign', id] })
      setDecisions({})
    },
    onError: () => toast.error('Failed to submit decisions'),
  })

  if (isLoading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>
  if (isError || !campaign) return (
    <div className="text-center py-24 text-muted">
      Campaign not found. <Link to="/compliance/campaigns" className="text-cyber-cyan hover:underline">Back</Link>
    </div>
  )

  const nhis     = (campaign.nhis ?? []) as NHI[]
  const decided  = Object.values(decisions).filter(Boolean).length
  const isClosed = campaign.status === 'CLOSED' || campaign.status === 'ARCHIVED'

  function decide(nhiId: string, d: CertificationDecision) {
    setDecisions((prev) => ({ ...prev, [nhiId]: prev[nhiId] === d ? null : d }))
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={campaign.name}
        subtitle={`${campaign.framework} · ${campaign.nhiScope.length} NHIs in scope`}
        breadcrumbs={[{ label: 'Compliance', href: '/compliance/campaigns' }, { label: 'Review' }]}
        actions={
          !isClosed && decided > 0 ? (
            <Button variant="primary" size="sm" loading={submit.isPending} onClick={() => submit.mutate()}>
              Submit {decided} Decision{decided !== 1 ? 's' : ''}
            </Button>
          ) : null
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'In Scope',    value: campaign.nhiScope.length, color: 'text-cyber-cyan' },
          { label: 'Decided',     value: campaign.decisions,        color: 'text-green-400' },
          { label: 'Pending',     value: campaign.pending,          color: 'text-amber-400' },
          { label: 'Due Date',    value: new Date(campaign.dueDate).toLocaleDateString(), color: 'text-main', small: true },
        ].map(({ label, value, color, small }) => (
          <div key={label} className="bg-surface border border-surface-border rounded-lg p-4 text-center">
            <p className={`font-mono font-bold ${small ? 'text-sm' : 'text-2xl'} ${color}`}>{value}</p>
            <p className="text-[11px] text-muted mt-1">{label}</p>
          </div>
        ))}
      </div>

      {isClosed && (
        <div className="mb-4 p-3 bg-green-400/5 border border-green-400/20 rounded text-xs text-green-400 font-mono">
          This campaign is {campaign.status.toLowerCase()} — no further decisions required.
        </div>
      )}

      <Card padding={false}>
        <div className="px-5 py-3 border-b border-surface-border bg-surface-2">
          <p className="font-mono text-[10px] tracking-widest uppercase text-cyber-cyan">Decision Queue</p>
        </div>
        <div className="divide-y divide-surface-border">
          {nhis.map((nhi) => {
            const myDecision = decisions[nhi.nhiId]
            return (
              <div key={nhi.nhiId} className="flex items-center gap-4 px-5 py-3 hover:bg-cyber-cyan/3 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-bright font-medium truncate">{nhi.displayName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge color="cyan">{nhi.nhiType}</Badge>
                    <Badge color={RISK_COLOR[nhi.riskLevel]}>{nhi.riskLevel}</Badge>
                    <span className="font-mono text-[10px] text-muted">{nhi.environment} · {nhi.ownerTeam ?? '—'}</span>
                  </div>
                </div>
                {!isClosed && (
                  <div className="flex gap-2 flex-shrink-0">
                    {(['CERTIFY','REVOKE','FLAG'] as CertificationDecision[]).map((d) => (
                      <button
                        key={d}
                        onClick={() => decide(nhi.nhiId, d)}
                        className={`font-mono text-[10px] px-2.5 py-1 rounded border transition-colors ${
                          myDecision === d
                            ? d === 'CERTIFY' ? 'bg-green-400/15 border-green-400 text-green-400'
                            : d === 'REVOKE'  ? 'bg-cyber-red/15 border-cyber-red text-cyber-red'
                            : 'bg-amber-400/15 border-amber-400 text-amber-400'
                            : 'bg-surface-2 border-surface-border text-muted hover:border-cyber-cyan/50'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          {nhis.length === 0 && (
            <div className="text-center py-12 text-muted text-sm">No NHIs in scope for this campaign.</div>
          )}
        </div>
      </Card>
    </div>
  )
}
