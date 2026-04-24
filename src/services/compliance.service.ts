import { get, post } from './api'
import type { ComplianceScore, CertificationCampaign, CertificationDecisionRecord, RegulatoryFramework } from '@/types/compliance.types'

export const complianceService = {
  getScores: (): Promise<ComplianceScore[]> =>
    get<ComplianceScore[]>('/compliance/score'),

  exportEvidence: (framework: RegulatoryFramework): Promise<{ url: string }> =>
    post<{ url: string }>(`/compliance/export/${framework}`),

  listCampaigns: (): Promise<CertificationCampaign[]> =>
    get<CertificationCampaign[]>('/certifications/campaigns'),

  createCampaign: (body: Partial<CertificationCampaign>): Promise<CertificationCampaign> =>
    post<CertificationCampaign>('/certifications/campaigns', body),

  submitDecisions: (campaignId: string, decisions: Omit<CertificationDecisionRecord, 'certifierId' | 'decidedAt'>[]): Promise<void> =>
    post<void>(`/certifications/${campaignId}/decisions`, decisions),
}
