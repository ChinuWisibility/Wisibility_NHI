import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { discoveryService } from '@/services/discovery.service'
import toast from 'react-hot-toast'

interface AddOciConnectorModalProps {
  open: boolean
  onClose: () => void
  onCreated?: (connectorId: string) => void
}

export function AddOciConnectorModal({ open, onClose, onCreated }: AddOciConnectorModalProps) {
  const [displayName, setDisplayName] = useState('OCI Tenancy')
  const [tenancyOcid, setTenancyOcid] = useState('')
  const [userOcid, setUserOcid] = useState('')
  const [fingerprint, setFingerprint] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [region, setRegion] = useState('us-ashburn-1')
  const [compartmentOcid, setCompartmentOcid] = useState('')
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setDisplayName('OCI Tenancy')
    setTenancyOcid('')
    setUserOcid('')
    setFingerprint('')
    setPrivateKey('')
    setPassphrase('')
    setRegion('us-ashburn-1')
    setCompartmentOcid('')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!tenancyOcid.trim() || !userOcid.trim() || !fingerprint.trim() || !privateKey.trim()) {
      toast.error('Tenancy OCID, user OCID, fingerprint, and API private key are required')
      return
    }
    setSaving(true)
    try {
      const connector = await discoveryService.createConnector({
        connectorType: 'CLOUD_OCI',
        displayName: displayName.trim() || 'OCI Tenancy',
        config: {
          tenancyOcid: tenancyOcid.trim(),
          userOcid: userOcid.trim(),
          fingerprint: fingerprint.trim(),
          privateKey: privateKey.trim(),
          region: region.trim() || 'us-ashburn-1',
          ...(passphrase.trim() ? { passphrase: passphrase.trim() } : {}),
          ...(compartmentOcid.trim() ? { compartmentOcid: compartmentOcid.trim() } : {}),
        },
      })
      toast.success('OCI connector created. Test it, then run a scan.')
      reset()
      onCreated?.(connector.connectorId)
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create OCI connector')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add OCI connector" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-slate-700 leading-relaxed">
          Use a <span className="font-semibold">read-only API key user</span> in the tenancy{' '}
          <span className="font-semibold">home region</span>. Grant inspect on users, groups, policies,
          dynamic groups, identity providers, compartments, and instances. Compass stores identity, policy,
          matching-rule, and last-used metadata — never API key material, auth tokens, or Vault secret values.
        </div>
        <Input label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <Input label="Tenancy OCID" value={tenancyOcid} onChange={(e) => setTenancyOcid(e.target.value)} placeholder="ocid1.tenancy.oc1.." required />
        <Input label="User OCID" value={userOcid} onChange={(e) => setUserOcid(e.target.value)} placeholder="ocid1.user.oc1.." required />
        <Input label="API key fingerprint" value={fingerprint} onChange={(e) => setFingerprint(e.target.value)} placeholder="aa:bb:cc:..." required />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="oci-private-key" className="text-xs font-bold tracking-wide uppercase text-slate-600 dark:text-muted">
            API private key (PEM)
          </label>
          <textarea
            id="oci-private-key"
            required
            rows={6}
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            placeholder={'-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'}
            className="w-full bg-white dark:bg-surface-2 border-[1.5px] border-slate-300 dark:border-surface-border rounded-xl px-3.5 py-2.5 text-sm font-mono text-main placeholder:text-slate-500 placeholder:font-normal shadow-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <Input label="Private key passphrase (optional)" type="password" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} />
        <Input label="Home region" value={region} onChange={(e) => setRegion(e.target.value)} hint="Identity APIs must be called in the tenancy home region, e.g. us-ashburn-1." />
        <Input label="Compartment OCID (optional)" value={compartmentOcid} onChange={(e) => setCompartmentOcid(e.target.value)} hint="If set, compute correlation is limited to this compartment. IAM is still tenancy-wide." />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" size="sm" loading={saving}>Create connector</Button>
        </div>
      </form>
    </Modal>
  )
}
