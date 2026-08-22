import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { discoveryService } from '@/services/discovery.service'
import toast from 'react-hot-toast'

interface AddAzureConnectorModalProps {
  open: boolean
  onClose: () => void
  onCreated?: (connectorId: string) => void
}

export function AddAzureConnectorModal({ open, onClose, onCreated }: AddAzureConnectorModalProps) {
  const [displayName, setDisplayName] = useState('Azure Entra ID')
  const [tenantId, setTenantId] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [subscriptionId, setSubscriptionId] = useState('')
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setDisplayName('Azure Entra ID')
    setTenantId('')
    setClientId('')
    setClientSecret('')
    setSubscriptionId('')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!tenantId.trim() || !clientId.trim() || !clientSecret.trim()) {
      toast.error('Tenant ID, Client ID, and Client Secret are required')
      return
    }

    setSaving(true)
    try {
      const connector = await discoveryService.createConnector({
        connectorType: 'CLOUD_AZURE',
        displayName: displayName.trim() || 'Azure Entra ID',
        config: {
          tenantId: tenantId.trim(),
          clientId: clientId.trim(),
          clientSecret: clientSecret.trim(),
          ...(subscriptionId.trim() ? { subscriptionId: subscriptionId.trim() } : {}),
        },
      })
      toast.success('Azure connector created. Test it, then run a scan.')
      reset()
      onCreated?.(connector.connectorId)
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create Azure connector'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Azure connector" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-[13px] text-slate-700 leading-relaxed">
          Grant Graph <span className="font-semibold">Application.Read.All</span>,
          <span className="font-semibold"> Directory.Read.All</span>,
          <span className="font-semibold"> Organization.Read.All</span>, and
          <span className="font-semibold"> RoleManagement.Read.Directory</span>
          {' '}(application permissions) plus admin consent.
          For the Azure NHI lab, also add <span className="font-semibold">Subscription ID</span> and assign this app
          <span className="font-semibold"> Reader</span> on that subscription so Compass can correlate RBAC, VMs, App Services, Functions, and UAMIs.
        </div>

        <Input
          label="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Azure Entra ID — Production"
        />
        <Input
          label="Directory (tenant) ID"
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          required
        />
        <Input
          label="Application (client) ID"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          required
        />
        <Input
          label="Client secret"
          type="password"
          value={clientSecret}
          onChange={(e) => setClientSecret(e.target.value)}
          placeholder="Paste the secret value, not the secret ID"
          required
        />
        <Input
          label="Subscription ID (optional)"
          value={subscriptionId}
          onChange={(e) => setSubscriptionId(e.target.value)}
          hint="Required for the lab: RBAC, Key Vault/Storage access, and workload correlation."
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" size="sm" loading={saving}>Create connector</Button>
        </div>
      </form>
    </Modal>
  )
}
