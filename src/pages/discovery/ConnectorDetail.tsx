import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { discoveryService } from '@/services/discovery.service'
import { nhiService } from '@/services/nhi.service'
import { useTestConnector, useTriggerDiscovery } from '@/hooks/useDiscovery'
import toast from 'react-hot-toast'
import { 
  UserGroupIcon, 
  IdentificationIcon, 
  ShieldExclamationIcon, 
  TagIcon,
  CircleStackIcon,
  GlobeAltIcon,
  CpuChipIcon,
  PresentationChartLineIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/utils/cn'
import type { AccentColor } from '@/components/ui/Card'

type TabType = 'overview' | 'identities' | 'config'

export default function ConnectorDetail() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = (searchParams.get('tab') as TabType) || 'overview'
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)

  useEffect(() => {
    const tab = searchParams.get('tab') as TabType
    if (tab && tab !== activeTab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setSearchParams({ tab }, { replace: true })
  }

  const [testing, setTesting] = useState(false)
  const [triggering, setTriggering] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [azureForm, setAzureForm] = useState({
    displayName: '',
    tenantId: '',
    clientId: '',
    clientSecret: '',
    subscriptionId: '',
  })
  const [awsForm, setAwsForm] = useState({
    displayName: '',
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1',
    roleArn: '',
    externalId: '',
  })
  const [ociForm, setOciForm] = useState({
    displayName: '',
    tenancyOcid: '',
    userOcid: '',
    fingerprint: '',
    privateKey: '',
    passphrase: '',
    region: 'us-ashburn-1',
    compartmentOcid: '',
  })
  const testConnector = useTestConnector()
  const triggerDiscovery = useTriggerDiscovery()
  const queryClient = useQueryClient()

  const handleTest = async () => {
    if (!id) return
    setTesting(true)
    try {
      const result = await testConnector.mutateAsync(id)
      if (result.connected) {
        toast.success(`Connection successful (${result.latencyMs}ms)`)
      } else {
        toast.error(`Connection failed: ${result.error || 'Unknown error'}`)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to test connection')
    } finally {
      setTesting(false)
    }
  }

  const handleSaveAzure = async () => {
    if (!id) return
    setSavingConfig(true)
    try {
      await discoveryService.updateConnector(id, {
        displayName: azureForm.displayName.trim() || 'Azure Entra ID',
        config: {
          tenantId: azureForm.tenantId.trim(),
          clientId: azureForm.clientId.trim(),
          ...(azureForm.clientSecret.trim() ? { clientSecret: azureForm.clientSecret.trim() } : {}),
          subscriptionId: azureForm.subscriptionId.trim(),
        },
      })
      toast.success('Azure connector saved')
      setAzureForm((f) => ({ ...f, clientSecret: '' }))
      void queryClient.invalidateQueries({ queryKey: ['connector', id] })
      void queryClient.invalidateQueries({ queryKey: ['connectors'] })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save connector')
    } finally {
      setSavingConfig(false)
    }
  }

  const handleSaveAws = async () => {
    if (!id) return
    setSavingConfig(true)
    try {
      await discoveryService.updateConnector(id, {
        displayName: awsForm.displayName.trim() || 'AWS Organization',
        config: {
          accessKeyId: awsForm.accessKeyId.trim(),
          ...(awsForm.secretAccessKey.trim() ? { secretAccessKey: awsForm.secretAccessKey.trim() } : {}),
          region: awsForm.region.trim() || 'us-east-1',
          roleArn: awsForm.roleArn.trim(),
          externalId: awsForm.externalId.trim(),
        },
      })
      toast.success('AWS connector saved')
      setAwsForm((f) => ({ ...f, secretAccessKey: '' }))
      void queryClient.invalidateQueries({ queryKey: ['connector', id] })
      void queryClient.invalidateQueries({ queryKey: ['connectors'] })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save connector')
    } finally {
      setSavingConfig(false)
    }
  }

  const handleSaveOci = async () => {
    if (!id) return
    setSavingConfig(true)
    try {
      await discoveryService.updateConnector(id, {
        displayName: ociForm.displayName.trim() || 'OCI Tenancy',
        config: {
          tenancyOcid: ociForm.tenancyOcid.trim(),
          userOcid: ociForm.userOcid.trim(),
          fingerprint: ociForm.fingerprint.trim(),
          ...(ociForm.privateKey.trim() ? { privateKey: ociForm.privateKey.trim() } : {}),
          ...(ociForm.passphrase.trim() ? { passphrase: ociForm.passphrase.trim() } : {}),
          region: ociForm.region.trim() || 'us-ashburn-1',
          compartmentOcid: ociForm.compartmentOcid.trim(),
        },
      })
      toast.success('OCI connector saved')
      setOciForm((f) => ({ ...f, privateKey: '', passphrase: '' }))
      void queryClient.invalidateQueries({ queryKey: ['connector', id] })
      void queryClient.invalidateQueries({ queryKey: ['connectors'] })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save connector')
    } finally {
      setSavingConfig(false)
    }
  }

  const { data: connector, isLoading: loadingConnector } = useQuery({
    queryKey: ['connector', id],
    queryFn:  () => discoveryService.getConnector(id!),
    enabled:  !!id,
  })

  useEffect(() => {
    if (!connector) return
    if (connector.connectorType === 'CLOUD_AZURE') {
      setAzureForm({
        displayName: connector.displayName,
        tenantId: connector.config.tenantId ?? '',
        clientId: connector.config.clientId ?? '',
        clientSecret: '',
        subscriptionId: connector.config.subscriptionId ?? '',
      })
    }
    if (connector.connectorType === 'CLOUD_AWS') {
      setAwsForm({
        displayName: connector.displayName,
        accessKeyId: connector.config.accessKeyId ?? '',
        secretAccessKey: '',
        region: connector.config.region ?? 'us-east-1',
        roleArn: connector.config.roleArn ?? '',
        externalId: connector.config.externalId ?? '',
      })
    }
    if (connector.connectorType === 'CLOUD_OCI') {
      setOciForm({
        displayName: connector.displayName,
        tenancyOcid: connector.config.tenancyOcid ?? '',
        userOcid: connector.config.userOcid ?? '',
        fingerprint: connector.config.fingerprint ?? '',
        privateKey: '',
        passphrase: '',
        region: connector.config.region ?? 'us-ashburn-1',
        compartmentOcid: connector.config.compartmentOcid ?? '',
      })
    }
  }, [connector])

  const { data: nhis, isLoading: loadingNHIs } = useQuery({
    queryKey: ['connector-nhis', id],
    queryFn:  () => nhiService.list({ sourceConnector: id, limit: 100 }),
    enabled:  !!id,
  })

  const handleForceRescan = async () => {
    if (!id || !connector) return
    setTriggering(true)
    try {
      await triggerDiscovery.mutateAsync({ connectorId: connector.connectorId, connectors: [connector.connectorType] })
      toast.success(`Discovery scan started for ${connector.displayName}`)
      window.setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: ['connector-nhis', id] })
        void queryClient.invalidateQueries({ queryKey: ['connector', id] })
        void queryClient.invalidateQueries({ queryKey: ['discovery-runs'] })
      }, 4000)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to trigger discovery')
    } finally {
      setTriggering(false)
    }
  }

  if (loadingConnector) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>
  if (!connector) return <div className="text-center py-24 text-muted">Connector not found.</div>

  const nhiItems = nhis?.items || []

  // Insights Data Aggregation
  const riskCounts = nhiItems.reduce((acc, curr) => {
    acc[curr.riskLevel] = (acc[curr.riskLevel] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const envCounts = nhiItems.reduce((acc, curr) => {
    acc[curr.environment] = (acc[curr.environment] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const teamCounts = nhiItems.reduce((acc, curr) => {
    const team = curr.ownerTeam || 'Unassigned'
    acc[team] = (acc[team] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const tabs = [
    { id: 'overview',   label: 'Overview',   icon: <PresentationChartLineIcon className="w-4 h-4" /> },
    { id: 'identities', label: 'Discovered', icon: <IdentificationIcon className="w-4 h-4" /> },
    { id: 'config',     label: 'Config',     icon: <Cog6ToothIcon className="w-4 h-4" /> },
  ]

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={connector.displayName}
        subtitle={`${connector.connectorType} Connector · ${connector.status}`}
        breadcrumbs={[{ label: 'Discovery', href: '/discovery/connectors' }, { label: connector.displayName }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <StatSmall label="Total Identities" value={connector.totalIdentities || 0} icon={<UserGroupIcon className="w-4 h-4" />} />
        <StatSmall label="NHIs Discovered" value={connector.nhiCount || 0} icon={<IdentificationIcon className="w-4 h-4" />} accent="cyan" />
        <StatSmall 
            label="Discovery Rate" 
            value={connector.totalIdentities ? `${Math.round((connector.nhiCount || 0) / connector.totalIdentities * 100)}%` : '0%'} 
            icon={<ShieldExclamationIcon className="w-4 h-4" />} 
        />
        <StatSmall label="Last Scan" value={connector.lastRunAt ? new Date(connector.lastRunAt).toLocaleDateString() : 'Never'} icon={<TagIcon className="w-4 h-4" />} />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-border mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as TabType)}
            className={cn(
              'flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2',
              activeTab === tab.id
                ? 'border-cyber-cyan text-cyber-cyan bg-cyber-cyan/5'
                : 'border-transparent text-muted hover:text-main hover:bg-surface-2/50'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card accent="cyan" className="lg:col-span-2">
              <CardHeader>Connector Insights</CardHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                <div className="space-y-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted border-b border-surface-border pb-2">Classifier / Env Spread</p>
                  <div className="space-y-3">
                    {Object.entries(envCounts).map(([env, count]) => (
                      <div key={env} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge color={env === 'PROD' ? 'red' : 'amber'} className="w-16 justify-center">{env}</Badge>
                          <span className="text-xs text-main">{env === 'PROD' ? 'Critical Infrastructure' : 'Development'}</span>
                        </div>
                        <span className="font-mono text-xs text-bright">{count}</span>
                      </div>
                    ))}
                    {Object.keys(envCounts).length === 0 && <p className="text-[10px] text-muted italic">No classification data</p>}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted border-b border-surface-border pb-2">Group / Team Distribution</p>
                  <div className="space-y-3">
                    {Object.entries(teamCounts).slice(0, 4).map(([team, count]) => (
                      <div key={team} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserGroupIcon className="w-3.5 h-3.5 text-muted" />
                          <span className="text-xs text-main">{team}</span>
                        </div>
                        <span className="font-mono text-xs text-bright">{count}</span>
                      </div>
                    ))}
                    {Object.keys(teamCounts).length === 0 && <p className="text-[10px] text-muted italic">No grouping data</p>}
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-surface-2 rounded border border-surface-border">
                <div className="flex items-center gap-2 mb-2">
                  <PresentationChartLineIcon className="w-4 h-4 text-cyber-cyan" />
                  <span className="text-xs font-bold text-bright">Security Posture Impact</span>
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  This connector contributes to <span className="text-cyber-cyan font-bold">{Math.round(nhiItems.length * 1.5)}%</span> of the overall system risk. 
                  Classification accuracy for this source is currently <span className="text-cyber-green font-bold">88%</span>.
                </p>
              </div>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>Risk Classifier</CardHeader>
                <div className="space-y-4 py-2">
                  {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(level => (
                    <div key={level} className="flex items-center justify-between">
                      <Badge color={level === 'CRITICAL' || level === 'HIGH' ? 'red' : level === 'MEDIUM' ? 'amber' : 'green'}>
                        {level}
                      </Badge>
                      <span className="font-mono text-xs text-main">{riskCounts[level] || 0}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <CardHeader>Identity Health</CardHeader>
                <div className="py-2 space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted">Active NHIs</span>
                    <span className="text-cyber-green font-mono">{nhiItems.filter(n => n.status === 'ACTIVE').length}</span>
                  </div>
                  <div className="w-full bg-surface-2 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-cyber-green h-full" style={{ width: '82%' }}></div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted">Dormant / Stale</span>
                    <span className="text-amber-500 font-mono">{nhiItems.filter(n => n.status === 'DORMANT').length}</span>
                  </div>
                  <div className="w-full bg-surface-2 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full" style={{ width: '18%' }}></div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'identities' && (
          <Card accent="cyan">
            <CardHeader>Discovered Non-Human Identities</CardHeader>
            {loadingNHIs ? (
              <div className="flex justify-center py-12"><Spinner size="md" /></div>
            ) : nhiItems.length === 0 ? (
              <p className="text-center py-12 text-muted text-sm font-mono">No NHIs found for this connector.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-surface-border">
                      <th className="py-3 px-4 text-[10px] font-bold text-muted uppercase tracking-wider">Display Name</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-muted uppercase tracking-wider">Type</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-muted uppercase tracking-wider">Group / Team</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-muted uppercase tracking-wider">Classifier / Env</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-muted uppercase tracking-wider">Risk</th>
                      <th className="py-3 px-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {nhiItems.map((n) => (
                      <tr key={n.nhiId} className="hover:bg-surface-2/50 transition-colors group">
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-bright">{n.displayName}</span>
                            <span className="text-[10px] text-muted font-mono">{n.nhiId.slice(0, 8)}...</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[10px] font-mono text-main">
                          {n.nhiType.replace(/_/g, ' ')}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] bg-surface-2 px-2 py-0.5 rounded text-main border border-surface-border">
                            {n.ownerTeam || 'Unassigned'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1 items-center">
                            <Badge color={n.environment === 'PROD' ? 'red' : 'amber'} className="text-[9px] px-1.5 py-0">
                              {n.environment}
                            </Badge>
                            <span className="text-[10px] text-muted">
                              {n.tags?.app || 'Unknown App'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge color={
                            n.riskLevel === 'CRITICAL' ? 'red' :
                            n.riskLevel === 'HIGH'     ? 'red' :
                            n.riskLevel === 'MEDIUM'   ? 'amber' : 'green'
                          }>
                            {n.riskLevel}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link 
                            to={`/inventory/${n.nhiId}`}
                            className="text-[10px] text-cyber-cyan opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                          >
                            Details →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'config' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>Connection Configuration</CardHeader>
              {connector.connectorType === 'CLOUD_AZURE' ? (
                <div className="space-y-4 py-4">
                  <p className="text-sm text-slate-600">
                    Paste the app registration values from Azure. Leave the secret blank to keep the one already stored.
                  </p>
                  <Input label="Display name" value={azureForm.displayName} onChange={(e) => setAzureForm((f) => ({ ...f, displayName: e.target.value }))} />
                  <Input label="Directory (tenant) ID" value={azureForm.tenantId} onChange={(e) => setAzureForm((f) => ({ ...f, tenantId: e.target.value }))} />
                  <Input label="Application (client) ID" value={azureForm.clientId} onChange={(e) => setAzureForm((f) => ({ ...f, clientId: e.target.value }))} />
                  <Input label="Client secret" type="password" value={azureForm.clientSecret} onChange={(e) => setAzureForm((f) => ({ ...f, clientSecret: e.target.value }))} placeholder={connector.config.clientSecret ? '••••••••  (unchanged unless you type a new value)' : 'Paste secret value'} />
                  <Input label="Subscription ID (optional)" value={azureForm.subscriptionId} onChange={(e) => setAzureForm((f) => ({ ...f, subscriptionId: e.target.value }))} />
                  <div className="flex justify-end">
                    <Button variant="primary" size="sm" loading={savingConfig} onClick={handleSaveAzure}>Save Azure config</Button>
                  </div>
                </div>
              ) : connector.connectorType === 'CLOUD_AWS' ? (
                <div className="space-y-4 py-4">
                  <p className="text-sm text-slate-600">
                    Use a read-only access key. Leave the secret blank to keep the stored key.
                  </p>
                  <Input label="Display name" value={awsForm.displayName} onChange={(e) => setAwsForm((f) => ({ ...f, displayName: e.target.value }))} />
                  <Input label="Access key ID" value={awsForm.accessKeyId} onChange={(e) => setAwsForm((f) => ({ ...f, accessKeyId: e.target.value }))} />
                  <Input label="Secret access key" type="password" value={awsForm.secretAccessKey} onChange={(e) => setAwsForm((f) => ({ ...f, secretAccessKey: e.target.value }))} placeholder={connector.config.secretAccessKey ? '••••••••  (unchanged unless you type a new value)' : 'Paste secret'} />
                  <Input label="Region" value={awsForm.region} onChange={(e) => setAwsForm((f) => ({ ...f, region: e.target.value }))} />
                  <Input label="Assume role ARN" value={awsForm.roleArn} onChange={(e) => setAwsForm((f) => ({ ...f, roleArn: e.target.value }))} />
                  <Input label="External ID" value={awsForm.externalId} onChange={(e) => setAwsForm((f) => ({ ...f, externalId: e.target.value }))} />
                  <div className="flex justify-end">
                    <Button variant="primary" size="sm" loading={savingConfig} onClick={handleSaveAws}>Save AWS config</Button>
                  </div>
                </div>
              ) : connector.connectorType === 'CLOUD_OCI' ? (
                <div className="space-y-4 py-4">
                  <p className="text-sm text-slate-600">
                    Use a read-only API key. Leave the private key blank to keep the stored PEM.
                  </p>
                  <Input label="Display name" value={ociForm.displayName} onChange={(e) => setOciForm((f) => ({ ...f, displayName: e.target.value }))} />
                  <Input label="Tenancy OCID" value={ociForm.tenancyOcid} onChange={(e) => setOciForm((f) => ({ ...f, tenancyOcid: e.target.value }))} />
                  <Input label="User OCID" value={ociForm.userOcid} onChange={(e) => setOciForm((f) => ({ ...f, userOcid: e.target.value }))} />
                  <Input label="API key fingerprint" value={ociForm.fingerprint} onChange={(e) => setOciForm((f) => ({ ...f, fingerprint: e.target.value }))} />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold tracking-wide uppercase text-slate-600">API private key (PEM)</label>
                    <textarea
                      rows={5}
                      value={ociForm.privateKey}
                      onChange={(e) => setOciForm((f) => ({ ...f, privateKey: e.target.value }))}
                      placeholder={connector.config.privateKey ? '••••••••  (unchanged unless you paste a new PEM)' : '-----BEGIN PRIVATE KEY-----'}
                      className="w-full bg-white dark:bg-surface-2 border-[1.5px] border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono"
                    />
                  </div>
                  <Input label="Passphrase" type="password" value={ociForm.passphrase} onChange={(e) => setOciForm((f) => ({ ...f, passphrase: e.target.value }))} placeholder={connector.config.passphrase ? '••••••••' : 'Optional'} />
                  <Input label="Home region" value={ociForm.region} onChange={(e) => setOciForm((f) => ({ ...f, region: e.target.value }))} />
                  <Input label="Compartment OCID" value={ociForm.compartmentOcid} onChange={(e) => setOciForm((f) => ({ ...f, compartmentOcid: e.target.value }))} />
                  <div className="flex justify-end">
                    <Button variant="primary" size="sm" loading={savingConfig} onClick={handleSaveOci}>Save OCI config</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  {Object.entries(connector.config).map(([key, val]) => (
                    <div key={key} className="flex flex-col gap-1 border-b border-surface-border pb-3 last:border-0">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-muted">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-xs text-bright font-mono">{key.toLowerCase().includes('secret') || key.toLowerCase().includes('key') ? '••••••••••••••••' : val}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>Resource Metadata</CardHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <MetadataItem icon={<GlobeAltIcon className="w-3.5 h-3.5" />} label="Source Region" value="Global / Multi-region" />
                  <MetadataItem icon={<CircleStackIcon className="w-3.5 h-3.5" />} label="Data Volume" value="~1.4 GB / scan" />
                  <MetadataItem icon={<CpuChipIcon className="w-3.5 h-3.5" />} label="Instance ID" value="i-08a12bc93d" />
                  <MetadataItem icon={<TagIcon className="w-3.5 h-3.5" />} label="Version" value="v2.4.1-stable" />
                </div>
              </Card>

              <Card accent="red">
                <CardHeader>Maintenance</CardHeader>
                <div className="py-4 space-y-4">
                   <div className="flex items-center justify-between">
                     <span className="text-xs text-main">Connection Status</span>
                     <Badge color={connector.status === 'ACTIVE' ? 'green' : 'red'}>{connector.status}</Badge>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-xs text-main">Last Successful Test</span>
                     <span className="font-mono text-[10px] text-muted">{connector.lastTestAt ? new Date(connector.lastTestAt).toLocaleString() : 'Never'}</span>
                   </div>
                   <div className="pt-4 flex gap-2">
                     <button 
                        disabled={testing}
                        onClick={handleTest}
                        className="flex-1 bg-surface-2 border border-surface-border text-bright text-[10px] font-bold py-2 rounded hover:bg-surface-3 transition-colors uppercase disabled:opacity-50"
                     >
                        {testing ? 'Testing...' : 'Test Connection'}
                     </button>
                     <button 
                        disabled={triggering}
                        onClick={handleForceRescan}
                        className="flex-1 bg-cyber-cyan/10 border border-cyber-cyan/40 text-cyber-cyan text-[10px] font-bold py-2 rounded hover:bg-cyber-cyan/20 transition-colors uppercase disabled:opacity-50"
                     >
                        {triggering ? 'Triggering...' : 'Force Re-scan'}
                     </button>
                   </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatSmall({ label, value, icon, accent }: { label: string, value: string | number, icon: React.ReactNode, accent?: AccentColor }) {
  return (
    <Card accent={accent} className="py-3 px-4">
      <div className="flex items-center gap-2 mb-1">
        <div className={cn(
            "p-1.5 rounded-md",
            accent === 'cyan' ? 'bg-cyber-cyan/10 text-cyber-cyan' : 'bg-surface-2 text-muted'
        )}>
          {icon}
        </div>
        <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-mono font-bold text-bright">{value}</p>
    </Card>
  )
}

function MetadataItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 text-muted">{icon}</div>
      <div className="flex flex-col">
        <span className="text-[9px] text-muted uppercase tracking-tighter">{label}</span>
        <span className="text-[11px] text-bright font-medium">{value}</span>
      </div>
    </div>
  )
}
