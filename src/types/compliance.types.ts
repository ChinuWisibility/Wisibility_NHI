export type RegulatoryFramework = 'SOX' | 'PCI_DSS' | 'DORA' | 'ISO_27001' | 'SOC2'

export type ComplianceStatus = 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT'

export type CertificationDecision = 'CERTIFY' | 'REVOKE' | 'FLAG'

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED'

export interface ComplianceScore {
  framework: RegulatoryFramework
  score:     number
  controls:  number
  passing:   number
  failing:   number
}

export interface CertificationCampaign {
  campaignId:   string
  name:         string
  framework:    RegulatoryFramework
  status:       CampaignStatus
  nhiScope:     string[]
  certifiers:   string[]
  dueDate:      string
  createdAt:    string
  closedAt?:    string
  decisions:    number
  pending:      number
}

export interface CertificationDecisionRecord {
  campaignId:  string
  nhiId:       string
  certifierId: string
  decision:    CertificationDecision
  justification: string
  decidedAt:   string
}
