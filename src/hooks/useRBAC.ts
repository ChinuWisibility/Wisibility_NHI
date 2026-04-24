import { useAuthStore } from '@/stores/authStore'
import { hasPermission } from '@/utils/rbac-matrix'
import { ROLE_LEVELS } from '@/types/user.types'
import type { UserRole, RBACAction } from '@/types/user.types'

export function useRBAC() {
  const userRole = useAuthStore((s) => s.userRole)

  const can = (action: RBACAction): boolean => {
    if (!userRole) return false
    return hasPermission(userRole, action)
  }

  const hasRole = (role: UserRole): boolean => userRole === role

  const isAtLeast = (role: UserRole): boolean => {
    if (!userRole) return false
    return ROLE_LEVELS[userRole] <= ROLE_LEVELS[role]
  }

  return { can, hasRole, isAtLeast, userRole }
}
