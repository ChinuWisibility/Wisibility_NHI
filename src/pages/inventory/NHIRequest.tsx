import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { nhiService } from '@/services/nhi.service'
import toast from 'react-hot-toast'

const schema = z.object({
  nhiType:       z.string().min(1, 'Required'),
  environment:   z.string().min(1, 'Required'),
  justification: z.string().min(20, 'Minimum 20 characters'),
  ownerTeam:     z.string().min(1, 'Required'),
})

type FormData = z.infer<typeof schema>

export default function NHIRequest() {
  const [step, setStep]         = useState<1 | 2 | 3>(1)
  const [submitted, setSubmitted] = useState(false)
  const { register, handleSubmit, getValues, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await nhiService.create(data as Parameters<typeof nhiService.create>[0])
      setSubmitted(true)
      toast.success('Request submitted for approval')
    } catch {
      toast.error('Failed to submit request')
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Badge color="green" className="mb-4">Submitted</Badge>
        <p className="font-display text-xl text-bright mb-2">Request Submitted</p>
        <p className="text-xs text-muted">Your request is pending approval from the Program Manager.</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-up max-w-2xl">
      <PageHeader
        title="Request New NHI"
        subtitle="Submit a request for a new non-human identity. Requires Program Manager approval."
        breadcrumbs={[{ label: 'Dev Portal', href: '/dev/dashboard' }, { label: 'Request NHI' }]}
      />

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full border font-mono text-[10px] flex items-center justify-center transition-colors ${
              step >= s ? 'border-cyber-cyan bg-cyber-cyan/10 text-cyber-cyan' : 'border-surface-border text-muted'
            }`}>{s}</span>
            <span className="text-[11px] text-muted">{['Type & Env', 'Justification', 'Review'][s - 1]}</span>
            {s < 3 && <span className="text-muted">→</span>}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {step === 1 && (
          <Card>
            <CardHeader>Step 1 — Identity Type & Environment</CardHeader>
            <div className="flex flex-col gap-4">
              <Input label="NHI Type" placeholder="e.g. SERVICE_ACCOUNT" error={errors.nhiType?.message} {...register('nhiType')} />
              <Input label="Environment" placeholder="PROD / STAGING / DEV" error={errors.environment?.message} {...register('environment')} />
              <Input label="Owner Team" placeholder="Your team name" error={errors.ownerTeam?.message} {...register('ownerTeam')} />
              <Button type="button" variant="primary" onClick={() => setStep(2)} className="self-end">Next →</Button>
            </div>
          </Card>
        )}
        {step === 2 && (
          <Card>
            <CardHeader>Step 2 — Business Justification</CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] tracking-widest uppercase text-muted">Justification</label>
                <textarea
                  className="w-full bg-surface-2 border border-surface-border rounded px-3 py-2 text-sm text-main placeholder:text-muted/50 focus:outline-none focus:border-cyber-cyan resize-none"
                  rows={4}
                  placeholder="Describe the business need for this NHI (min 20 chars)"
                  {...register('justification')}
                />
                {errors.justification && <p className="text-[11px] text-cyber-red">{errors.justification.message}</p>}
              </div>
              <div className="flex gap-2 self-end">
                <Button type="button" variant="ghost" onClick={() => setStep(1)}>← Back</Button>
                <Button type="button" variant="primary" onClick={() => setStep(3)}>Next →</Button>
              </div>
            </div>
          </Card>
        )}
        {step === 3 && (
          <Card>
            <CardHeader>Step 3 — Review & Submit</CardHeader>
            <dl className="grid grid-cols-2 gap-3 text-xs mb-6">
              {Object.entries(getValues()).map(([k, v]) => (
                <div key={k}>
                  <dt className="font-mono text-[9px] uppercase tracking-wider text-muted">{k}</dt>
                  <dd className="text-main mt-0.5">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => setStep(2)}>← Back</Button>
              <Button type="submit" variant="primary">Submit Request</Button>
            </div>
          </Card>
        )}
      </form>
    </div>
  )
}
