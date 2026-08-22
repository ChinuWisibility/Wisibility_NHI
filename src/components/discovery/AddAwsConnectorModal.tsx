import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { discoveryService } from '@/services/discovery.service'
import toast from 'react-hot-toast'

interface AddAwsConnectorModalProps {
  open: boolean
  onClose: () => void
  onCreated?: (connectorId: string) => void
}

export function AddAwsConnectorModal({ open, onClose, onCreated }: AddAwsConnectorModalProps) {
  const [displayName, setDisplayName] = useState('AWS Organization')
  const [accessKeyId, setAccessKeyId] = useState('')
  const [secretAccessKey, setSecretAccessKey] = useState('')
  const [region, setRegion] = useState('us-east-1')
  const [roleArn, setRoleArn] = useState('')
  const [externalId, setExternalId] = useState('')
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setDisplayName('AWS Organization')
    setAccessKeyId('')
    setSecretAccessKey('')
    setRegion('us-east-1')
    setRoleArn('')
    setExternalId('')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!accessKeyId.trim() || !secretAccessKey.trim()) {
      toast.error('Access Key ID and Secret Access Key are required')
      return
    }
    setSaving(true)
    try {
      const connector = await discoveryService.createConnector({
        connectorType: 'CLOUD_AWS',
        displayName: displayName.trim() || 'AWS Organization',
        config: {
          accessKeyId: accessKeyId.trim(),
          secretAccessKey: secretAccessKey.trim(),
          region: region.trim() || 'us-east-1',
          ...(roleArn.trim() ? { roleArn: roleArn.trim() } : {}),
          ...(externalId.trim() ? { externalId: externalId.trim() } : {}),
        },
      })
      toast.success('AWS connector created. Test it, then run a scan.')
      reset()
      onCreated?.(connector.connectorId)
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create AWS connector')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add AWS connector" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-slate-700 leading-relaxed">
          Prefer a <span className="font-semibold">read-only IAM user or AssumeRole</span> with SecurityAudit / ViewOnlyAccess,
          plus IAM, EC2, Lambda, ECS, EKS, and Secrets Manager list/describe. Compass never stores secret values from Secrets Manager
          — only identity, trust, workload, and last-used metadata.
        </div>
        <Input label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <Input label="Access key ID" value={accessKeyId} onChange={(e) => setAccessKeyId(e.target.value)} placeholder="AKIA..." required />
        <Input label="Secret access key" type="password" value={secretAccessKey} onChange={(e) => setSecretAccessKey(e.target.value)} required />
        <Input label="Region" value={region} onChange={(e) => setRegion(e.target.value)} hint="Used for STS, EC2, Lambda, ECS, EKS, and Secrets Manager." />
        <Input label="Assume role ARN (optional)" value={roleArn} onChange={(e) => setRoleArn(e.target.value)} placeholder="arn:aws:iam::123456789012:role/WisibilityNHIReadOnly" />
        <Input label="External ID (optional)" value={externalId} onChange={(e) => setExternalId(e.target.value)} hint="Required if the role trust policy uses sts:ExternalId." />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" size="sm" loading={saving}>Create connector</Button>
        </div>
      </form>
    </Modal>
  )
}
