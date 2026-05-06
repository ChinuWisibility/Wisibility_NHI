import { get } from './api'
import type { NHI } from '@/types/nhi.types'

export interface VaultSummary {
  connectors:   { connectorId: string; displayName: string; connectorType: string; status: string; nhiCount: number }[]
  totalInVault: number
  totalWithout: number
  total:        number
}

export interface RotationJob {
  nhiId:          string
  nhiName:        string
  nhiType:        string
  environment:    string
  ownerTeam:      string
  schedule:       string
  lastRotatedAt:  string
  nextRotationAt: string
  daysUntil:      number
  status:         'OVERDUE' | 'DUE_SOON' | 'SCHEDULED'
}

export interface RotationSummary {
  jobs:     RotationJob[]
  total:    number
  overdue:  number
  dueSoon:  number
}

export interface HygieneCategory {
  label:    string
  count:    number
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface HygieneSummary {
  total:      number
  hardcoded:  number
  shared:     number
  noVault:    number
  noOwner:    number
  stale90:    number
  byCategory: HygieneCategory[]
  nhis:       { hardcoded: NHI[]; shared: NHI[]; noVault: NHI[] }
}

export const securityService = {
  getVaults:  (): Promise<VaultSummary>  => get<VaultSummary>('/security/vaults'),
  getRotation:(): Promise<RotationSummary> => get<RotationSummary>('/security/rotation'),
  getHygiene: (): Promise<HygieneSummary>  => get<HygieneSummary>('/security/hygiene'),
}
