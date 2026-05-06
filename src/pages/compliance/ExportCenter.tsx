import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { complianceService } from '@/services/compliance.service'
import { downloadFromUrl } from '@/utils/export-helpers'
import type { RegulatoryFramework } from '@/types/compliance.types'
import toast from 'react-hot-toast'
import { useState } from 'react'

const FRAMEWORKS: { label: string; fw: RegulatoryFramework }[] = [
  { label: 'SOX',       fw: 'SOX' },
  { label: 'PCI DSS v4', fw: 'PCI_DSS' },
  { label: 'DORA',      fw: 'DORA' },
  { label: 'ISO 27001', fw: 'ISO_27001' },
  { label: 'SOC 2',     fw: 'SOC2' },
]

export default function ExportCenter() {
  const [loading, setLoading] = useState<RegulatoryFramework | null>(null)

  const handleExport = async (fw: RegulatoryFramework) => {
    setLoading(fw)
    try {
      const { url } = await complianceService.exportEvidence(fw)
      downloadFromUrl(url, `NHI-Evidence-${fw}.pdf`)
      toast.success(`${fw} evidence pack generated`)
    } catch {
      toast.error('Export failed')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="animate-fade-up max-w-2xl">
      <PageHeader
        title="Export Center"
        subtitle="Generate compliance evidence packs as PDF. Pre-signed download links expire after 15 minutes."
        breadcrumbs={[{ label: 'Compliance' }, { label: 'Export Center' }]}
      />
      <Card accent="purple">
        <CardHeader>Evidence Packs</CardHeader>
        <div className="space-y-3">
          {FRAMEWORKS.map(({ label, fw }) => (
            <div key={fw} className="flex items-center justify-between py-3 border-b border-surface-border last:border-0">
              <div>
                <p className="text-sm text-bright">{label}</p>
                <p className="font-mono text-[10px] text-muted mt-0.5">Full evidence pack with NHI decisions + timestamps</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                loading={loading === fw}
                onClick={() => handleExport(fw)}
              >
                Generate PDF
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
