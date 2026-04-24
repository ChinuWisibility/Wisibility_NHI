import { get, getPaginated, post } from './api'
import type { PostureIssue, PostureReport, PostureIssueCategory, RemediationStatus } from '@/types/posture.types'
import type { PaginatedResponse } from '@/types/api.types'

export const postureService = {
  getReport: (): Promise<PostureReport> =>
    get<PostureReport>('/posture/report'),

  listIssues: (params?: {
    category?: PostureIssueCategory
    status?:   RemediationStatus
    page?:     number
    limit?:    number
  }): Promise<PaginatedResponse<PostureIssue>> =>
    getPaginated<PostureIssue>('/posture/issues', params as Record<string, unknown>),

  remediate: (issueId: string): Promise<void> =>
    post<void>(`/posture/issues/${issueId}/remediate`),
}
