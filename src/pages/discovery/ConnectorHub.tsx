import { useState, useRef } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { useConnectors, useTriggerDiscovery, useTestConnector } from '@/hooks/useDiscovery'
import { 
  ServerIcon, 
  ArrowUpTrayIcon, 
  UserGroupIcon, 
  IdentificationIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline'
import { discoveryService } from '@/services/discovery.service'
import { AddAzureConnectorModal } from '@/components/discovery/AddAzureConnectorModal'
import { AddAwsConnectorModal } from '@/components/discovery/AddAwsConnectorModal'
import { AddOciConnectorModal } from '@/components/discovery/AddOciConnectorModal'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

export default function ConnectorHub() {
  const { data: connectors, isLoading } = useConnectors()
  const triggerDiscovery = useTriggerDiscovery()
  const testConnector = useTestConnector()
  const [triggering, setTriggering] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [addAzureOpen, setAddAzureOpen] = useState(false)
  const [addAwsOpen, setAddAwsOpen] = useState(false)
  const [addOciOpen, setAddOciOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const handleTriggerAll = async () => {
    setTriggering(true)
    try {
      await triggerDiscovery.mutateAsync('ALL')
      toast.success('Discovery scan started for all connectors')
    } catch {
      toast.error('Failed to trigger discovery')
    } finally {
      setTriggering(false)
    }
  }

  const handleTest = async (id: string) => {
    setTestingId(id)
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
      setTestingId(null)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const result = await discoveryService.ingest(file)
      toast.success(result.message)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to upload file'
      console.error('[Upload Error]', err)
      toast.error(errorMsg, { duration: 5000 })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="animate-fade-up">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".json,.csv"
        onChange={handleFileUpload}
      />
      <PageHeader
        title="Connector Hub"
        subtitle="Manage integrations with identity sources. Configure, test, and trigger discovery."
        breadcrumbs={[{ label: 'Discovery' }, { label: 'Connectors' }]}
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              loading={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <ArrowUpTrayIcon className="w-4 h-4 mr-1" />
              Upload Identities
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setAddAzureOpen(true)}>+ Add Azure</Button>
            <Button variant="secondary" size="sm" onClick={() => setAddAwsOpen(true)}>+ Add AWS</Button>
            <Button variant="secondary" size="sm" onClick={() => setAddOciOpen(true)}>+ Add OCI</Button>
            <Button variant="primary" size="sm" loading={triggering} onClick={handleTriggerAll}>
              ▶ Trigger All
            </Button>
          </div>
        }
      />
      {isLoading && <div className="flex justify-center py-16"><Spinner size="lg" /></div>}
      {!isLoading && (!connectors || connectors.length === 0) && (
        <EmptyState
          icon={<ServerIcon className="w-10 h-10" />}
          title="No connectors configured"
          message="Add your first connector to start discovering NHIs."
          action={<Button variant="primary" size="sm" onClick={() => setAddAzureOpen(true)}>Add Azure Connector</Button>}
        />
      )}
      {connectors && connectors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connectors.map((c) => (
            <Card 
              key={c.connectorId} 
              accent="cyan" 
              className="cursor-pointer hover:border-cyber-cyan/50 transition-colors"
              onClick={() => navigate(`/discovery/connectors/${c.connectorId}`)}
            >
              <CardHeader>{c.connectorType}</CardHeader>
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm text-bright font-medium">{c.displayName}</p>
                <Badge color={
                  c.status === 'ACTIVE' ? 'green' :
                  c.status === 'ERROR'  ? 'red'   : 'amber'
                }>{c.status}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-surface-light p-2 rounded-lg border border-surface-border">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted mb-1">
                    <UserGroupIcon className="w-3 h-3" />
                    <span>Total Identities</span>
                  </div>
                  <p className="text-sm font-mono font-bold text-main">{c.totalIdentities?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-cyber-cyan/5 p-2 rounded-lg border border-cyber-cyan/20">
                  <div className="flex items-center gap-1.5 text-[10px] text-cyber-cyan mb-1">
                    <IdentificationIcon className="w-3 h-3" />
                    <span>NHIs Found</span>
                  </div>
                  <p className="text-sm font-mono font-bold text-cyber-cyan">{c.nhiCount?.toLocaleString() || 0}</p>
                </div>
              </div>

              {c.lastRunAt && (
                <p className="font-mono text-[10px] text-muted">Last run: {new Date(c.lastRunAt).toLocaleString()}</p>
              )}
              <div className="flex gap-2 mt-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => { 
                    e.stopPropagation()
                    navigate(`/discovery/connectors/${c.connectorId}?tab=config`)
                  }}
                >
                  Edit
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm"
                  loading={testingId === c.connectorId}
                  onClick={(e) => { 
                    e.stopPropagation()
                    handleTest(c.connectorId)
                  }}
                >
                  Test
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="ml-auto text-cyber-cyan hover:bg-cyber-cyan/10"
                  onClick={(e) => { 
                    e.stopPropagation()
                    navigate(`/discovery/connectors/${c.connectorId}?tab=identities`)
                  }}
                >
                  <InformationCircleIcon className="w-4 h-4 mr-1" />
                  Info
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <AddAzureConnectorModal
        open={addAzureOpen}
        onClose={() => setAddAzureOpen(false)}
        onCreated={(id) => {
          void queryClient.invalidateQueries({ queryKey: ['connectors'] })
          navigate(`/discovery/connectors/${id}?tab=config`)
        }}
      />
      <AddAwsConnectorModal
        open={addAwsOpen}
        onClose={() => setAddAwsOpen(false)}
        onCreated={(id) => {
          void queryClient.invalidateQueries({ queryKey: ['connectors'] })
          navigate(`/discovery/connectors/${id}?tab=config`)
        }}
      />
      <AddOciConnectorModal
        open={addOciOpen}
        onClose={() => setAddOciOpen(false)}
        onCreated={(id) => {
          void queryClient.invalidateQueries({ queryKey: ['connectors'] })
          navigate(`/discovery/connectors/${id}?tab=config`)
        }}
      />
    </div>
  )
}
