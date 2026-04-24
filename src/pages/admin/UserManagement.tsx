import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { USER_ROLE_LABELS } from '@/types/user.types'

export default function UserManagement() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="User Management"
        subtitle="Manage Entra ID users, App Role assignments, and Conditional Access enforcement."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Users' }]}
        actions={<Button variant="primary" size="sm">+ Invite User</Button>}
      />
      <Card accent="cyan">
        <CardHeader>Role Legend</CardHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(USER_ROLE_LABELS).map(([role, label]) => (
            <div key={role} className="flex items-center gap-2 py-2">
              <Badge color="cyan">{role}</Badge>
              <span className="text-xs text-[#b8cfe6]">{label}</span>
            </div>
          ))}
        </div>
      </Card>
      <div className="mt-4">
        <Card accent="none">
          <CardHeader>Users</CardHeader>
          <p className="text-xs text-[#5a7a9a]">Connect to Azure Entra ID to manage users and App Role assignments.</p>
        </Card>
      </div>
    </div>
  )
}
