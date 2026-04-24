import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { useConnectors, useTriggerDiscovery } from '@/hooks/useDiscovery'
import { ServerIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function ConnectorHub() {
  const { data: connectors, isLoading } = useConnectors()
  const triggerDiscovery = useTriggerDiscovery()
  const [triggering, setTriggering] = useState(false)

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

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Connector Hub"
        subtitle="Manage integrations with identity sources. Configure, test, and trigger discovery."
        breadcrumbs={[{ label: 'Discovery' }, { label: 'Connectors' }]}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">+ Add Connector</Button>
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
          action={<Button variant="primary" size="sm">Add Connector</Button>}
        />
      )}
      {connectors && connectors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connectors.map((c) => (
            <Card key={c.connectorId} accent="cyan">
              <CardHeader>{c.connectorType}</CardHeader>
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm text-[#e2eeff] font-medium">{c.displayName}</p>
                <Badge color={
                  c.status === 'ACTIVE' ? 'green' :
                  c.status === 'ERROR'  ? 'red'   : 'amber'
                }>{c.status}</Badge>
              </div>
              {c.lastRunAt && (
                <p className="font-mono text-[10px] text-[#5a7a9a]">Last run: {c.lastRunAt}</p>
              )}
              <div className="flex gap-2 mt-3">
                <Button variant="ghost" size="sm">Edit</Button>
                <Button variant="secondary" size="sm">Test</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
