import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { StatCard } from '@/components/ui/StatCard'
import { Spinner } from '@/components/ui/Spinner'
import { UsersIcon, ShieldCheckIcon, ExclamationTriangleIcon, KeyIcon } from '@heroicons/react/24/outline'
import { get } from '@/services/api'
import type { UserRole } from '@/types/user.types'

interface User {
  userId:     string
  email:      string
  name:       string
  role:       UserRole
  mfaEnabled: boolean
  createdAt:  string
}

const ROLE_LABEL: Record<UserRole, string> = {
  L0: 'Super Admin',
  L1: 'Program Manager',
  L2: 'Security Analyst',
  L3: 'Developer',
  L4: 'Auditor',
  L5: 'Viewer',
}
const ROLE_COLOR: Record<UserRole, 'red'|'amber'|'cyan'|'green'|'purple'|'blue'> = {
  L0: 'red', L1: 'amber', L2: 'cyan', L3: 'green', L4: 'purple', L5: 'blue',
}

export default function UserManagement() {
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn:  () => get<User[]>('/users'),
  })

  const byRole = users?.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1
    return acc
  }, {}) ?? {}

  const noMfa  = users?.filter((u) => !u.mfaEnabled).length ?? 0
  const admins = (byRole['L0'] ?? 0) + (byRole['L1'] ?? 0)

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="User Management"
        subtitle="Manage Entra ID users, App Role assignments, and access levels."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Users' }]}
        actions={<Button variant="primary" size="sm">+ Invite User</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Users"    value={users?.length ?? '—'} sub="Platform members"         icon={<UsersIcon className="w-5 h-5" />}              accent="cyan" />
        <StatCard label="Admins"         value={admins}               sub="L0 + L1 combined"         icon={<ShieldCheckIcon className="w-5 h-5" />}        accent="amber" />
        <StatCard label="MFA Disabled"   value={noMfa}                sub="Without MFA enforcement"  icon={<ExclamationTriangleIcon className="w-5 h-5" />} accent={noMfa > 0 ? 'red' : 'green'} />
        <StatCard label="Active Roles"   value={Object.keys(byRole).length} sub="Distinct roles assigned" icon={<KeyIcon className="w-5 h-5" />}          accent="purple" />
      </div>

      {isLoading && <div className="flex justify-center py-12"><Spinner size="lg" /></div>}

      {users && (
        <Card padding={false}>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-surface-2 border-b border-surface-border">
                {['Name','Email','Role','MFA','Member Since',''].map((h) => (
                  <th key={h} className="font-mono text-[10px] tracking-widest uppercase text-cyber-cyan px-4 py-3 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.userId} className="border-b border-surface-border/70 hover:bg-cyber-cyan/5 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-bright font-medium">{u.name}</p>
                    <p className="font-mono text-[10px] text-muted">{u.userId}</p>
                  </td>
                  <td className="px-4 py-3 text-main">{u.email}</td>
                  <td className="px-4 py-3">
                    <div>
                      <Badge color={ROLE_COLOR[u.role]}>{u.role}</Badge>
                      <p className="text-[10px] text-muted mt-0.5">{ROLE_LABEL[u.role]}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {u.mfaEnabled
                      ? <Badge color="green">Enabled</Badge>
                      : <Badge color="red">Disabled</Badge>}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button className="font-mono text-[10px] text-cyber-cyan hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
