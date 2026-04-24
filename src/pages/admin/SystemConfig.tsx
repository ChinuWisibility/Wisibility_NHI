import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function SystemConfig() {
  return (
    <div className="animate-fade-up max-w-2xl">
      <PageHeader
        title="System Configuration"
        subtitle="Platform-wide settings stored in Azure App Configuration."
        breadcrumbs={[{ label: 'Admin' }, { label: 'System Config' }]}
      />
      <div className="space-y-4">
        <Card accent="amber">
          <CardHeader>Risk Score Weights</CardHeader>
          <div className="grid grid-cols-2 gap-4">
            {[['Privilege Weight', '0.30'], ['Breadth Weight', '0.25'], ['Age Weight', '0.20'], ['Exposure Weight', '0.15'], ['Usage Weight', '0.10']].map(([label, val]) => (
              <Input key={label} label={label} defaultValue={val} />
            ))}
          </div>
          <Button variant="primary" size="sm" className="mt-4">Save Weights</Button>
        </Card>
        <Card accent="cyan">
          <CardHeader>Session & Security</CardHeader>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Session Timeout (min)" defaultValue="60" />
            <Input label="Max Login Attempts" defaultValue="5" />
          </div>
          <Button variant="primary" size="sm" className="mt-4">Save Settings</Button>
        </Card>
      </div>
    </div>
  )
}
