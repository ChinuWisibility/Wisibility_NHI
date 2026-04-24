export type UserRole = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5'

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  L0: 'Super Admin',
  L1: 'Program Manager',
  L2: 'Security Analyst',
  L3: 'Developer / DevOps',
  L4: 'Auditor / Compliance',
  L5: 'Read-Only Viewer',
}

export const ROLE_LEVELS: Record<UserRole, number> = {
  L0: 0,
  L1: 1,
  L2: 2,
  L3: 3,
  L4: 4,
  L5: 5,
}

export type RBACAction =
  | 'VIEW_INVENTORY'
  | 'CREATE_NHI_REQUEST'
  | 'APPROVE_REQUEST'
  | 'MANAGE_CONNECTORS'
  | 'TRIGGER_DISCOVERY'
  | 'VIEW_POSTURE'
  | 'REMEDIATE_ISSUE'
  | 'VIEW_ALERTS'
  | 'DISMISS_ALERT'
  | 'ESCALATE_ALERT'
  | 'TRIGGER_ROTATION'
  | 'VIEW_COMPLIANCE'
  | 'EXPORT_COMPLIANCE'
  | 'MANAGE_CAMPAIGNS'
  | 'SUBMIT_CERTIFICATION'
  | 'VIEW_AUDIT_LOG'
  | 'MANAGE_USERS'
  | 'SYSTEM_CONFIG'
  | 'VIEW_VAULT'

export interface User {
  userId: string
  email: string
  name: string
  role: UserRole
  mfaEnabled: boolean
  createdAt: string
  lastLogin?: string
}
