import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'

const RISK_WEIGHTS = [
  { key: 'privilege', label: 'Privilege Weight',  value: '0.30', desc: 'Impact of privilege level on risk score' },
  { key: 'breadth',   label: 'Breadth Weight',    value: '0.25', desc: 'Scope of access / lateral spread factor' },
  { key: 'age',       label: 'Age Weight',         value: '0.20', desc: 'Age of credential since last rotation' },
  { key: 'exposure',  label: 'Exposure Weight',    value: '0.15', desc: 'Whether credential is hardcoded/shared' },
  { key: 'usage',     label: 'Usage Weight',       value: '0.10', desc: 'Activity and usage pattern anomaly score' },
]

const ALERT_THRESHOLDS = [
  { key: 'vol_spike',  label: 'Volume Spike Multiplier',  value: '3.0',  desc: 'Alert when call volume exceeds N× baseline' },
  { key: 'stale_days', label: 'Stale Account (days)',     value: '60',   desc: 'Flag dormant accounts after N days' },
  { key: 'cert_days',  label: 'Cert Expiry Warning (days)',value: '30',  desc: 'Alert on certificates expiring within N days' },
]

const INTEGRATIONS = [
  { label: 'Azure Entra ID',     status: 'Connected',    color: 'green'  as const },
  { label: 'HashiCorp Vault',    status: 'Connected',    color: 'green'  as const },
  { label: 'GitHub Actions',     status: 'Connected',    color: 'green'  as const },
  { label: 'Datadog',            status: 'Partial',      color: 'amber'  as const },
  { label: 'JIRA / ITSM',        status: 'Not Connected',color: 'red'    as const },
  { label: 'Slack Notifications',status: 'Not Connected',color: 'red'    as const },
]

export default function SystemConfig() {
  const [riskWeights,     setRiskWeights]     = useState(() => Object.fromEntries(RISK_WEIGHTS.map((w) => [w.key, w.value])))
  const [alertThresholds, setAlertThresholds] = useState(() => Object.fromEntries(ALERT_THRESHOLDS.map((t) => [t.key, t.value])))
  const [session,         setSession]         = useState({ timeout: '60', maxAttempts: '5', jwtExpiry: '8h' })

  return (
    <div className="animate-fade-up max-w-3xl">
      <PageHeader
        title="System Configuration"
        subtitle="Platform-wide settings for risk scoring, alerting, and integrations."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Settings' }]}
      />

      <div className="space-y-4">
        {/* Risk Score Weights */}
        <Card accent="amber">
          <CardHeader>Risk Score Weights</CardHeader>
          <p className="text-[11px] text-muted mb-4">Weights must sum to 1.00. Adjust to prioritise different risk factors.</p>
          <div className="space-y-3">
            {RISK_WEIGHTS.map((w) => (
              <div key={w.key} className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-xs text-bright">{w.label}</p>
                  <p className="text-[10px] text-muted">{w.desc}</p>
                </div>
                <input
                  type="number" min="0" max="1" step="0.05"
                  value={riskWeights[w.key]}
                  onChange={(e) => setRiskWeights((p) => ({ ...p, [w.key]: e.target.value }))}
                  className="w-20 bg-surface-2 border border-surface-border rounded px-2 py-1.5 text-sm font-mono text-cyber-cyan text-right focus:outline-none focus:border-cyber-cyan/60"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-border">
            <span className="font-mono text-[11px] text-muted">
              Sum: <span className={Math.abs(Object.values(riskWeights).reduce((s, v) => s + parseFloat(v||'0'), 0) - 1) < 0.001 ? 'text-green-400' : 'text-cyber-red'}>
                {Object.values(riskWeights).reduce((s, v) => s + parseFloat(v||'0'), 0).toFixed(2)}
              </span>
            </span>
            <Button variant="primary" size="sm" onClick={() => toast.success('Risk weights saved')}>Save Weights</Button>
          </div>
        </Card>

        {/* Alert Thresholds */}
        <Card accent="red">
          <CardHeader>Alert & Detection Thresholds</CardHeader>
          <div className="space-y-3">
            {ALERT_THRESHOLDS.map((t) => (
              <div key={t.key} className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-xs text-bright">{t.label}</p>
                  <p className="text-[10px] text-muted">{t.desc}</p>
                </div>
                <input
                  type="number" min="0"
                  value={alertThresholds[t.key]}
                  onChange={(e) => setAlertThresholds((p) => ({ ...p, [t.key]: e.target.value }))}
                  className="w-20 bg-surface-2 border border-surface-border rounded px-2 py-1.5 text-sm font-mono text-cyber-cyan text-right focus:outline-none focus:border-cyber-cyan/60"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4 pt-3 border-t border-surface-border">
            <Button variant="primary" size="sm" onClick={() => toast.success('Alert thresholds saved')}>Save Thresholds</Button>
          </div>
        </Card>

        {/* Session & Security */}
        <Card accent="cyan">
          <CardHeader>Session & Security</CardHeader>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Session Timeout (min)" value={session.timeout}     onChange={(e) => setSession((p) => ({ ...p, timeout:     e.target.value }))} />
            <Input label="Max Login Attempts"    value={session.maxAttempts} onChange={(e) => setSession((p) => ({ ...p, maxAttempts: e.target.value }))} />
            <Input label="JWT Expiry"            value={session.jwtExpiry}   onChange={(e) => setSession((p) => ({ ...p, jwtExpiry:   e.target.value }))} />
          </div>
          <div className="flex justify-end mt-4 pt-3 border-t border-surface-border">
            <Button variant="primary" size="sm" onClick={() => toast.success('Session settings saved')}>Save Settings</Button>
          </div>
        </Card>

        {/* Integrations */}
        <Card accent="purple">
          <CardHeader>Integration Status</CardHeader>
          <div className="space-y-2">
            {INTEGRATIONS.map((int) => (
              <div key={int.label} className="flex items-center justify-between py-2.5 px-3 border border-surface-border rounded-lg hover:border-cyber-cyan/30 transition-colors">
                <span className="text-sm text-main">{int.label}</span>
                <div className="flex items-center gap-3">
                  <Badge color={int.color}>{int.status}</Badge>
                  {int.status === 'Not Connected' && (
                    <button className="font-mono text-[10px] text-cyber-cyan hover:underline">Configure</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
