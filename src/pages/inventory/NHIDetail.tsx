import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useNHIDetail } from '@/hooks/useNHI'
import { formatDate, formatCredentialAge, riskLevelBg } from '@/utils/formatters'
import { cn } from '@/utils/cn'

const TABS = [
  'Overview', 'Ownership', 'Lineage', 'Access', 'Usage',
  'Credentials', 'Risk', 'Lifecycle', 'Certifications', 'Remediation', 'Audit',
] as const

type Tab = typeof TABS[number]

export default function NHIDetail() {
  const { id }              = useParams<{ id: string }>()
  const { data, isLoading } = useNHIDetail(id ?? '')
  const [tab, setTab]       = useState<Tab>('Overview')

  if (isLoading) return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
  if (!data) return <p className="text-xs text-muted p-6">NHI not found.</p>

  const orphan = !data.ownerTeam
  const azure = data.tags.platform === 'azure'
  const aws = data.tags.platform === 'aws'
  const oci = data.tags.platform === 'oci'
  const cloud = azure || aws || oci
  const split = (value?: string) => (value ? value.split('|').map((s) => s.trim()).filter(Boolean) : [])

  return (
    <div className="animate-fade-up max-w-5xl">
      <PageHeader
        title={data.displayName}
        subtitle={`${data.nhiType.replace(/_/g, ' ')} · ${data.environment} · ${data.status}`}
        breadcrumbs={[{ label: 'Inventory', href: '/inventory' }, { label: data.displayName }]}
        actions={
          <Link to="/intelligence/blast-radius">
            <Button variant="secondary" size="sm">Blast radius</Button>
          </Link>
        }
      />

      <div className="flex gap-1 overflow-x-auto mb-5 border-b border-slate-200 pb-px">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-3 py-2 text-xs font-bold whitespace-nowrap border-b-2 transition-colors',
              tab === t ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-800',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <Card accent="cyan" className="lg:col-span-1">
              <CardHeader>NHI Security Posture</CardHeader>
              <p className={`text-4xl font-extrabold mb-2 ${riskLevelBg(data.riskLevel).split(' ')[0]}`}>
                {data.riskScore}
              </p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${riskLevelBg(data.riskLevel)}`}>
                {data.riskLevel}
              </span>
              <p className="text-xs text-slate-600 mt-3">Explainable score from privilege, age, exposure, usage and ownership.</p>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader>Identity Details</CardHeader>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                {[
                  { label: 'NHI ID', value: data.nhiId },
                  { label: 'Type', value: data.nhiType },
                  { label: 'Status', value: data.status },
                  { label: 'Environment', value: data.environment },
                  { label: 'Privilege', value: data.privilegeLevel },
                  { label: 'Owner Team', value: data.ownerTeam ?? 'Orphaned' },
                  { label: 'Shared', value: data.isShared ? 'Yes' : 'No' },
                  { label: 'Hardcoded', value: data.isHardcoded ? 'Yes' : 'No' },
                  { label: 'Created', value: formatDate(data.createdAt) },
                  { label: 'Credential age', value: formatCredentialAge(data.createdAt) },
                  { label: 'Vault', value: data.vaultPath ?? 'Not in vault' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</dt>
                    <dd className="text-sm font-medium text-slate-900 mt-0.5 truncate">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>Connector</CardHeader>
              <p className="text-sm font-bold text-slate-900">{data.sourceConnector}</p>
              <p className="text-xs text-slate-600 mt-1">Last discovered {formatDate(data.lastDiscovered)}</p>
              <div className="mt-3"><Badge color="green">SUCCESS</Badge></div>
            </Card>
            {Object.keys(data.tags).length > 0 && (
              <Card>
                <CardHeader>Metadata</CardHeader>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.tags).map(([k, v]) => (
                    <Badge key={k} color="dim">{k}: {v}</Badge>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </>
      )}

      {tab === 'Ownership' && (
        <Card>
          <CardHeader>Workforce attribution</CardHeader>
          {orphan && <div className="mb-3"><Badge color="red">Orphaned NHI</Badge></div>}
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {[
              ['Technical owner', data.ownerTeam ?? 'Unassigned'],
              ['Business owner', '—'],
              ['Creator', '—'],
              ['Approver', '—'],
              ['Application owner', '—'],
              ['Last reviewer', '—'],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] font-bold uppercase text-slate-500">{k}</dt>
                <dd className="font-semibold text-slate-900 mt-0.5">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {tab === 'Access' && cloud && (
        <Card>
          <CardHeader>Authorization</CardHeader>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <dt className="text-[11px] font-bold uppercase text-slate-500">
                {aws ? 'IAM policies' : oci ? 'IAM policies' : 'Azure RBAC'}
              </dt>
              <dd className="mt-1 space-y-1">
                {(aws || oci ? split(data.tags.policies) : split(data.tags.rbac)).length
                  ? (aws || oci ? split(data.tags.policies) : split(data.tags.rbac)).map((row) => (
                    <p key={row} className="font-medium text-slate-900">{row}</p>
                  ))
                  : <p className="text-slate-500">No assignments discovered</p>}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase text-slate-500">
                {aws ? 'Trust' : oci ? 'Groups / matching rule' : 'Sensitive access'}
              </dt>
              <dd className="mt-1">
                {aws ? (
                  <>
                    <p>Principals: {data.tags.trust_principals || '—'}</p>
                    <p>Services: {data.tags.trust_services || '—'}</p>
                  </>
                ) : oci ? (
                  <>
                    <p>Groups: {data.tags.groups || '—'}</p>
                    <p>Matching rule: {data.tags.matching_rule || '—'}</p>
                  </>
                ) : (
                  <>
                    <p>Key Vault: {data.tags.kv_access === 'yes' ? 'Yes' : 'No'}</p>
                    <p>Storage: {data.tags.storage_access === 'yes' ? 'Yes' : 'No'}</p>
                  </>
                )}
              </dd>
            </div>
          </dl>
        </Card>
      )}

      {tab === 'Credentials' && cloud && (
        <Card>
          <CardHeader>Authentication metadata</CardHeader>
          <p className="text-xs text-slate-500 mb-3">Secret values are never collected. Only type, age, and last-used metadata.</p>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {(oci ? [
              ['Method', data.tags.oci_kind === 'dynamic-group' ? 'Instance / resource principal' : data.tags.oci_kind === 'identity-provider' ? 'Federation' : 'IAM user API key'],
              ['Tenancy', data.tags.tenancy || '—'],
              ['OCID', data.tags.ocid || '—'],
              ['API keys', data.tags.api_key_count || '0'],
              ['Auth tokens', data.tags.auth_token_count || '0'],
              ['Customer secret keys', data.tags.customer_secret_key_count || '0'],
              ['Key age (days)', data.tags.key_age_days || '—'],
              ['Last used (days)', data.tags.last_used_days || '—'],
            ] : aws ? [
              ['Method', data.nhiType === 'OIDC' ? 'OIDC / federation' : data.tags.aws_kind === 'user' ? 'IAM user access key' : 'Temporary STS (role)'],
              ['Account', data.tags.account || '—'],
              ['ARN', data.tags.arn || '—'],
              ['Access keys', data.tags.access_key_count || '0'],
              ['Key age (days)', data.tags.key_age_days || '—'],
              ['Last used (days)', data.tags.last_used_days || '—'],
            ] : [
              ['Method', data.nhiType === 'OIDC' ? 'Federated identity' : data.nhiType === 'IAM_ROLE' ? 'Managed identity' : 'Client secret / certificate'],
              ['Client secrets', data.tags.secret_count || '0'],
              ['Certificates', data.tags.cert_count || '0'],
              ['Federated credentials', data.tags.fic_count || '0'],
              ['Secret age (days)', data.tags.secret_age_days || '—'],
              ['Expires', data.certExpiry ? formatDate(data.certExpiry) : '—'],
              ['Issuers', data.tags.fic_issuers || '—'],
              ['Subjects', data.tags.fic_subjects || '—'],
            ]).map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] font-bold uppercase text-slate-500">{k}</dt>
                <dd className="font-semibold text-slate-900 mt-0.5 break-all">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {tab === 'Lineage' && cloud && (
        <Card>
          <CardHeader>Workloads and blast radius</CardHeader>
          <p className="text-sm text-slate-700 mb-3">
            {data.tags.workloads || 'No attached VM, App Service, Function, or compute instance discovered.'}
          </p>
          <p className="text-xs text-slate-500">
            Identity type: {data.tags.sp_type || data.tags.aws_kind || data.tags.oci_kind || data.nhiType}
            {data.tags.attachment_count ? ` · attached workloads: ${data.tags.attachment_count}` : ''}
          </p>
        </Card>
      )}

      {tab === 'Risk' && (
        <Card>
          <CardHeader>Risk contributors</CardHeader>
          <ul className="space-y-2 text-sm text-slate-700">
            {cloud && split(data.tags.risk_reasons).map((reason) => <li key={reason}>{reason}</li>)}
            {cloud && data.tags.findings && (
              <li>Rules: {data.tags.findings}</li>
            )}
            {orphan && <li>No owner — production identities without attribution raise risk automatically.</li>}
            {data.isHardcoded && <li>Credential appears hardcoded / not vaulted.</li>}
            {data.isShared && <li>Shared across consumers — blast radius is wider.</li>}
            {(data.privilegeLevel === 'ADMIN' || data.privilegeLevel === 'ELEVATED') && (
              <li>Elevated privilege on {data.environment}.</li>
            )}
            <li>Credential age {formatCredentialAge(data.createdAt)}.</li>
          </ul>
        </Card>
      )}

      {tab === 'Lifecycle' && (
        <Card>
          <CardHeader>Lifecycle state</CardHeader>
          <p className="text-sm font-semibold text-slate-800 mb-4">Current: {data.status}</p>
          <div className="flex flex-wrap gap-2">
            {['Requested', 'Created', 'Active', 'Review', 'Rotation', 'Suspended', 'Decommissioned', 'Archived'].map((s) => (
              <span key={s} className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-bold text-slate-600 bg-slate-50">{s}</span>
            ))}
          </div>
        </Card>
      )}

      {!(
        tab === 'Overview' || tab === 'Ownership' || tab === 'Risk' || tab === 'Lifecycle'
        || (cloud && (tab === 'Access' || tab === 'Credentials' || tab === 'Lineage'))
      ) && (
        <Card>
          <CardHeader>{tab}</CardHeader>
          <p className="text-sm text-slate-600 mb-4">
            This identity-profile tab is part of the Compass model (lineage, usage vs granted access, certifications, remediation and audit).
          </p>
          <Link to="/dashboard"><Button variant="secondary" size="sm">Back to Command Center</Button></Link>
        </Card>
      )}
    </div>
  )
}
