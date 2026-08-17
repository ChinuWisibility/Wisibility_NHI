import { format, formatDistanceToNow, differenceInDays } from 'date-fns'
import type { RiskLevel } from '@/types/nhi.types'
import type { AlertSeverity } from '@/types/alert.types'

export function formatDate(iso: string): string {
  return format(new Date(iso), 'dd MMM yyyy')
}

export function formatDateTime(iso: string): string {
  return format(new Date(iso), 'dd MMM yyyy HH:mm')
}

export function formatRelativeTime(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true })
}

export function formatCredentialAge(iso: string): string {
  const days = differenceInDays(new Date(), new Date(iso))
  if (days < 30)  return `${days}d`
  if (days < 365) return `${Math.floor(days / 30)}mo`
  return `${Math.floor(days / 365)}y`
}

export function formatRiskLevel(level: RiskLevel): string {
  return level.charAt(0) + level.slice(1).toLowerCase()
}

export function riskLevelColor(level: RiskLevel): string {
  return {
    CRITICAL: 'text-red-700 dark:text-cyber-red',
    HIGH:     'text-amber-700 dark:text-cyber-amber',
    MEDIUM:   'text-orange-700 dark:text-cyber-amber',
    LOW:      'text-green-700 dark:text-cyber-green',
  }[level]
}

export function riskLevelBg(level: RiskLevel): string {
  return {
    CRITICAL: 'bg-red-50 text-red-800 border-red-200 dark:bg-cyber-red/10 dark:text-cyber-red dark:border-cyber-red/40',
    HIGH:     'bg-amber-50 text-amber-800 border-amber-300 dark:bg-cyber-amber/10 dark:text-cyber-amber dark:border-cyber-amber/40',
    MEDIUM:   'bg-orange-50 text-orange-800 border-orange-200 dark:bg-cyber-amber/10 dark:text-cyber-amber dark:border-cyber-amber/40',
    LOW:      'bg-green-50 text-green-800 border-green-200 dark:bg-cyber-green/10 dark:text-cyber-green dark:border-cyber-green/40',
  }[level]
}

export function severityColor(sev: AlertSeverity): string {
  return {
    SEV1: 'text-red-700 dark:text-cyber-red',
    SEV2: 'text-amber-700 dark:text-cyber-amber',
    SEV3: 'text-orange-700 dark:text-cyber-amber',
    SEV4: 'text-blue-700 dark:text-cyber-cyan',
  }[sev]
}

export function severityBg(sev: AlertSeverity): string {
  return {
    SEV1: 'bg-red-50 text-red-800 border-red-200 dark:bg-cyber-red/10 dark:text-cyber-red dark:border-cyber-red/40',
    SEV2: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-cyber-amber/10 dark:text-cyber-amber dark:border-cyber-amber/40',
    SEV3: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-cyber-amber/10 dark:text-cyber-amber dark:border-cyber-amber/40',
    SEV4: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-cyber-cyan/10 dark:text-cyber-cyan dark:border-cyber-cyan/40',
  }[sev]
}
