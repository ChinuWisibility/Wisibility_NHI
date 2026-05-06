import type { NHIType, RiskLevel, Environment } from './nhi.types'

export type PolicyAction =
  | 'REQUIRE_ROTATION'
  | 'ENFORCE_VAULT'
  | 'ALERT'
  | 'REQUIRE_REVIEW'
  | 'BLOCK_DEPLOYMENT'
  | 'REQUIRE_MFA'

export interface PolicyFilters {
  nhiType?:     NHIType[]
  riskLevel?:   RiskLevel[]
  environment?: Environment[]
  ownerTeam?:   string[]
}

export interface Policy {
  policyId:     string
  name:         string
  description:  string
  enabled:      boolean
  filters:      PolicyFilters
  action:       PolicyAction
  affectedCount: number
  createdAt:    string
  updatedAt:    string
  createdBy:    string
}
