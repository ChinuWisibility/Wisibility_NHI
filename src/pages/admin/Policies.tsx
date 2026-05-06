import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { Switch } from '@/components/ui/Switch'
import { policiesService } from '@/services/policies.service'
import { ShieldCheckIcon, UsersIcon } from '@heroicons/react/24/outline'
import { cn } from '@/utils/cn'
import type { Policy, PolicyAction, PolicyFilters } from '@/types/policy.types'
import type { NHIType, RiskLevel, Environment } from '@/types/nhi.types'
import toast from 'react-hot-toast'

// ── Constants ─────────────────────────────────────────────────────────────────
const NHI_TYPES: NHIType[] = [
  'SERVICE_ACCOUNT','API_KEY','WEBHOOK_SECRET','LONG_LIVED_TOKEN',
  'CERTIFICATE','RPA_BOT','IAM_ROLE','OIDC','SPIFFE_SVID',
]
const RISK_LEVELS: RiskLevel[]   = ['CRITICAL','HIGH','MEDIUM','LOW']
const ENVIRONMENTS: Environment[] = ['PROD','STAGING','DEV','TEST']
const ACTIONS: { value: PolicyAction; label: string; color: 'red'|'amber'|'cyan'|'green'|'purple'|'blue' }[] = [
  { value: 'REQUIRE_ROTATION',  label: 'Require Rotation',   color: 'amber'  },
  { value: 'ENFORCE_VAULT',     label: 'Enforce Vault',      color: 'cyan'   },
  { value: 'ALERT',             label: 'Alert',              color: 'red'    },
  { value: 'REQUIRE_REVIEW',    label: 'Require Review',     color: 'purple' },
  { value: 'BLOCK_DEPLOYMENT',  label: 'Block Deployment',   color: 'red'    },
  { value: 'REQUIRE_MFA',       label: 'Require MFA',        color: 'green'  },
]

const RISK_COLORS: Record<RiskLevel, 'red'|'amber'|'cyan'|'green'> = {
  CRITICAL: 'red', HIGH: 'amber', MEDIUM: 'cyan', LOW: 'green',
}

// ── Multi-select chip component ───────────────────────────────────────────────
function ChipSelect<T extends string>({
  label, options, value, onChange,
}: {
  label: string
  options: T[]
  value: T[]
  onChange: (v: T[]) => void
}) {
  const toggle = (opt: T) =>
    onChange(value.includes(opt) ? value.filter((x) => x !== opt) : [...value, opt])

  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-[10px] tracking-[1px] uppercase text-muted">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-2.5 py-1 rounded text-[11px] font-mono border transition-colors ${
              value.includes(opt)
                ? 'bg-cyber-cyan/15 border-cyber-cyan text-cyber-cyan'
                : 'bg-surface-2 border-surface-border text-muted hover:border-cyber-cyan/50 hover:text-main'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {value.length === 0 && (
        <p className="text-[10px] text-muted italic">None selected = matches all</p>
      )}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: '', description: '', enabled: true, action: 'ALERT' as PolicyAction,
  filters: { nhiType: [] as NHIType[], riskLevel: [] as RiskLevel[], environment: [] as Environment[], ownerTeam: [] as string[] },
}

function PolicyModal({
  policy, onClose,
}: {
  policy: Policy | null
  onClose: () => void
}) {
  const qc = useQueryClient()
  const isEdit = !!policy

  const [form, setForm] = useState(() =>
    policy
      ? {
          name:        policy.name,
          description: policy.description,
          enabled:     policy.enabled,
          action:      policy.action,
          filters: {
            nhiType:     policy.filters.nhiType     ?? [],
            riskLevel:   policy.filters.riskLevel   ?? [],
            environment: policy.filters.environment ?? [],
            ownerTeam:   policy.filters.ownerTeam   ?? [],
          },
        }
      : { ...EMPTY_FORM, filters: { ...EMPTY_FORM.filters } },
  )

  const [ownerInput, setOwnerInput] = useState(
    policy?.filters.ownerTeam?.join(', ') ?? '',
  )
  const [preview, setPreview] = useState<number | null>(
    policy?.affectedCount ?? null,
  )
  const [previewing, setPreviewing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!form.name.trim()) newErrors.name = 'Name is required'
    if (form.name.length < 3) newErrors.name = 'Name must be at least 3 characters'
    if (!form.description.trim()) newErrors.description = 'Description is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        filters: {
          ...form.filters,
          ownerTeam: ownerInput.split(',').map((s) => s.trim()).filter(Boolean),
        },
      }
      return isEdit
        ? policiesService.update(policy!.policyId, payload)
        : policiesService.create(payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Policy updated' : 'Policy created')
      qc.invalidateQueries({ queryKey: ['policies'] })
      onClose()
    },
    onError: () => toast.error('Failed to save policy'),
  })

  const handleSave = () => {
    if (validate()) {
      saveMutation.mutate()
    }
  }

  const handlePreview = async () => {
    setPreviewing(true)
    try {
      const filters: PolicyFilters = {
        ...form.filters,
        ownerTeam: ownerInput.split(',').map((s) => s.trim()).filter(Boolean),
      }
      const res = await policiesService.preview(filters)
      setPreview(res.count)
    } finally {
      setPreviewing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-surface border border-surface-border rounded-lg shadow-2xl overflow-hidden animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyber-cyan/10 rounded border border-cyber-cyan/30">
              <ShieldCheckIcon className="w-4 h-4 text-cyber-cyan" />
            </div>
            <div>
              <h2 className="font-display text-sm font-semibold text-bright">
                {isEdit ? 'Refine Policy' : 'Forge New Policy'}
              </h2>
              <p className="text-[10px] text-muted font-mono uppercase tracking-tighter">Governance Engine v2.4</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-cyber-red transition-colors text-xl leading-none px-2">×</button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Name + enabled */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
            <div className="md:col-span-3">
              <Input
                label="Policy Name"
                placeholder="e.g. Enforce Vault for PROD Secrets"
                value={form.name}
                error={errors.name}
                onChange={(e) => {
                  setForm((f) => ({ ...f, name: e.target.value }))
                  if (errors.name) setErrors(prev => ({ ...prev, name: '' }))
                }}
              />
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <label className="font-mono text-[10px] tracking-[1px] uppercase text-muted">Status</label>
              <div className="flex items-center gap-3 bg-surface-2 p-2 rounded border border-surface-border">
                <Switch
                  size="sm"
                  enabled={form.enabled}
                  onChange={(enabled) => setForm((f) => ({ ...f, enabled }))}
                />
                <span className={cn("text-[10px] font-bold uppercase", form.enabled ? "text-cyber-cyan" : "text-muted")}>
                  {form.enabled ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] tracking-[1px] uppercase text-muted">Operational Intent</label>
            <textarea
              rows={2}
              placeholder="Detail the security objective of this policy..."
              value={form.description}
              onChange={(e) => {
                setForm((f) => ({ ...f, description: e.target.value }))
                if (errors.description) setErrors(prev => ({ ...prev, description: '' }))
              }}
              className={cn(
                "w-full bg-surface-2 border rounded px-3 py-2 text-sm text-main placeholder:text-muted/50 focus:outline-none focus:border-cyber-cyan/60 resize-none transition-colors",
                errors.description ? "border-cyber-red" : "border-surface-border"
              )}
            />
            {errors.description && <p className="text-[10px] text-cyber-red font-mono">{errors.description}</p>}
          </div>

          {/* Action */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] tracking-[1px] uppercase text-muted">Enforcement Action</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {ACTIONS.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, action: a.value }))}
                  className={cn(
                    "px-3 py-2 rounded text-[10px] font-mono border transition-all flex flex-col items-start gap-1 text-left",
                    form.action === a.value
                      ? 'bg-cyber-cyan/15 border-cyber-cyan text-cyber-cyan shadow-[0_0_10px_rgba(0,200,240,0.1)]'
                      : 'bg-surface-2 border-surface-border text-muted hover:border-cyber-cyan/40 hover:text-main'
                  )}
                >
                  <span className="font-bold">{a.label}</span>
                  <span className="text-[8px] opacity-60 uppercase tracking-tighter">Impact: {a.color === 'red' ? 'High' : 'Medium'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-surface-border pt-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 bg-cyber-cyan rounded-full animate-pulse-slow"></div>
              <p className="font-mono text-[10px] tracking-[2px] uppercase text-cyber-cyan font-bold">
                Targeting Filters (AND Logic)
              </p>
            </div>
            
            <div className="space-y-6 bg-surface-2/40 p-4 rounded-lg border border-surface-border/50">
              <ChipSelect
                label="Identity Types"
                options={NHI_TYPES}
                value={form.filters.nhiType ?? []}
                onChange={(v) => setForm((f) => ({ ...f, filters: { ...f.filters, nhiType: v } }))}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ChipSelect
                  label="Risk Levels"
                  options={RISK_LEVELS}
                  value={form.filters.riskLevel ?? []}
                  onChange={(v) => setForm((f) => ({ ...f, filters: { ...f.filters, riskLevel: v } }))}
                />
                <ChipSelect
                  label="Target Environments"
                  options={ENVIRONMENTS}
                  value={form.filters.environment ?? []}
                  onChange={(v) => setForm((f) => ({ ...f, filters: { ...f.filters, environment: v } }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] tracking-[1px] uppercase text-muted">Owner Team Inclusion</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Payments, Security, DevOps..."
                    value={ownerInput}
                    onChange={(e) => setOwnerInput(e.target.value)}
                    className="w-full bg-surface-2 border border-surface-border rounded px-3 py-2 text-sm text-main placeholder:text-muted/50 focus:outline-none focus:border-cyber-cyan/60 pr-10"
                  />
                  <UsersIcon className="absolute right-3 top-2.5 w-4 h-4 text-muted/40" />
                </div>
                <p className="text-[9px] text-muted italic">Comma-separated list of teams to match.</p>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center justify-between p-4 bg-cyber-cyan/5 border border-cyber-cyan/20 rounded-lg">
            <div className="flex items-center gap-3">
               <div className="flex flex-col">
                 <span className="text-[10px] text-muted uppercase font-bold">Estimated Impact</span>
                 <span className="font-mono text-lg text-bright">
                   {preview !== null ? preview.toLocaleString() : '—'} <span className="text-xs text-muted">Identities</span>
                 </span>
               </div>
            </div>
            <Button variant="ghost" size="sm" loading={previewing} onClick={handlePreview} className="text-cyber-cyan border-cyber-cyan/30">
              Run Impact Preview
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-surface-border bg-surface-2/50">
          <Button variant="ghost" size="sm" onClick={onClose} className="border-transparent">Discard</Button>
          <Button
            variant="primary" size="sm"
            loading={saveMutation.isPending}
            onClick={handleSave}
            disabled={!form.name.trim()}
            className="shadow-[0_0_15px_rgba(0,200,240,0.2)]"
          >
            {isEdit ? 'Authorize Changes' : 'Initialize Policy'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Policies() {
  const qc = useQueryClient()
  const { data: policies, isLoading } = useQuery({
    queryKey: ['policies'],
    queryFn:  policiesService.list,
  })

  const [modalPolicy, setModalPolicy] = useState<Policy | null | undefined>(undefined)
  // undefined = closed, null = new, Policy = edit

  const toggleMutation = useMutation({
    mutationFn: (p: Policy) => policiesService.update(p.policyId, { enabled: !p.enabled }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['policies'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => policiesService.delete(id),
    onSuccess:  () => { toast.success('Policy deleted'); qc.invalidateQueries({ queryKey: ['policies'] }) },
  })

  const actionMeta = (action: PolicyAction) => ACTIONS.find((a) => a.value === action)

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Policies"
        subtitle="Define rules that enforce governance on the NHI inventory based on Type, Risk, Environment, and Owner."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Policies' }]}
        actions={
          <Button variant="primary" size="sm" onClick={() => setModalPolicy(null)}>
            + New Policy
          </Button>
        }
      />

      {isLoading && <div className="flex justify-center py-16"><Spinner size="lg" /></div>}

      {policies && (
        <div className="space-y-3">
          {policies.length === 0 && (
            <Card>
              <div className="text-center py-12 text-muted text-sm">
                No policies yet.{' '}
                <button onClick={() => setModalPolicy(null)} className="text-cyber-cyan hover:underline">
                  Create the first one
                </button>
              </div>
            </Card>
          )}

          {policies.map((p) => {
            const meta = actionMeta(p.action)
            return (
              <Card key={p.policyId} padding={false}>
                <div className={`border-l-2 rounded-lg px-5 py-4 transition-colors ${p.enabled ? 'border-cyber-cyan' : 'border-surface-border'}`}>
                  {/* Top row: name + toggle + actions */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Enabled dot */}
                      <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${p.enabled ? 'bg-cyber-cyan' : 'bg-surface-border'}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-bright leading-snug">{p.name}</p>
                        {p.description && (
                          <p className="text-[11px] text-muted mt-0.5 leading-relaxed">{p.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Right controls */}
                    <div className="flex items-center gap-4 flex-shrink-0 pt-0.5">
                      <span className="font-mono text-[11px] text-muted border-r border-surface-border pr-4 h-5 flex items-center">
                        <span className="text-cyber-cyan font-semibold text-sm mr-1">{p.affectedCount.toLocaleString()}</span>
                        NHIs
                      </span>
                      <Switch
                        size="sm"
                        enabled={p.enabled}
                        onChange={() => toggleMutation.mutate(p)}
                      />
                      <div className="flex gap-2.5 ml-1">
                        <button
                          onClick={() => setModalPolicy(p)}
                          className="font-mono text-[10px] uppercase tracking-wider text-cyber-cyan hover:text-white transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => { if (confirm(`Delete "${p.name}"?`)) deleteMutation.mutate(p.policyId) }}
                          className="font-mono text-[10px] uppercase tracking-wider text-cyber-red hover:text-white transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bottom row: action + filter chips */}
                  <div className="mt-3 ml-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                    {/* Action */}
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[9px] tracking-widest uppercase text-muted">Action</span>
                      <Badge color={meta?.color ?? 'cyan'}>{meta?.label ?? p.action}</Badge>
                    </div>

                    {/* Type */}
                    {!!p.filters.nhiType?.length && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[9px] tracking-widest uppercase text-muted">Type</span>
                        {p.filters.nhiType.map((t) => (
                          <Badge key={t} color="cyan">{t.replace(/_/g, ' ')}</Badge>
                        ))}
                      </div>
                    )}

                    {/* Risk */}
                    {!!p.filters.riskLevel?.length && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[9px] tracking-widest uppercase text-muted">Risk</span>
                        {p.filters.riskLevel.map((r) => (
                          <Badge key={r} color={RISK_COLORS[r]}>{r}</Badge>
                        ))}
                      </div>
                    )}

                    {/* Environment */}
                    {!!p.filters.environment?.length && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[9px] tracking-widest uppercase text-muted">Env</span>
                        {p.filters.environment.map((e) => (
                          <Badge key={e} color="purple">{e}</Badge>
                        ))}
                      </div>
                    )}

                    {/* Owner */}
                    {!!p.filters.ownerTeam?.length && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[9px] tracking-widest uppercase text-muted">Owner</span>
                        <span className="text-[11px] text-main">{p.filters.ownerTeam.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {modalPolicy !== undefined && (
        <PolicyModal policy={modalPolicy} onClose={() => setModalPolicy(undefined)} />
      )}
    </div>
  )
}
