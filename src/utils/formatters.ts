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
    CRITICAL: 'text-cyber-red',
    HIGH:     'text-cyber-amber',
    MEDIUM:   'text-yellow-400',
    LOW:      'text-cyber-green',
  }[level]
}

export function riskLevelBg(level: RiskLevel): string {
  return {
    CRITICAL: 'bg-cyber-red/10 text-cyber-red border-cyber-red/30',
    HIGH:     'bg-cyber-amber/10 text-cyber-amber border-cyber-amber/30',
    MEDIUM:   'bg-yellow-400/10 text-yellow-400 border-yellow-400/30',
    LOW:      'bg-cyber-green/10 text-cyber-green border-cyber-green/30',
  }[level]
}

export function severityColor(sev: AlertSeverity): string {
  return {
    SEV1: 'text-cyber-red',
    SEV2: 'text-cyber-amber',
    SEV3: 'text-yellow-400',
    SEV4: 'text-cyber-cyan',
  }[sev]
}

export function severityBg(sev: AlertSeverity): string {
  return {
    SEV1: 'bg-cyber-red/10 text-cyber-red border-cyber-red/30',
    SEV2: 'bg-cyber-amber/10 text-cyber-amber border-cyber-amber/30',
    SEV3: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30',
    SEV4: 'bg-cyber-cyan/10 text-cyber-cyan border-cyber-cyan/30',
  }[sev]
}
