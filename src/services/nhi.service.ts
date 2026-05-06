import { get, getPaginated, post, put, del } from './api'
import type { NHI, NHIListParams } from '@/types/nhi.types'
import type { PaginatedResponse } from '@/types/api.types'

export interface NHISummary {
  total:         number
  byStatus:      Record<string, number>
  byRisk:        Record<string, number>
  byEnvironment: Record<string, number>
  byType:        Record<string, number>
  hardcoded:     number
  shared:        number
  noVault:       number
  inVault:       number
  teamsCount:    number
}

export const nhiService = {
  list: (params: NHIListParams): Promise<PaginatedResponse<NHI>> =>
    getPaginated<NHI>('/nhi', params as Record<string, unknown>),

  getById: (id: string): Promise<NHI> =>
    get<NHI>(`/nhi/${id}`),

  getSummary: (): Promise<NHISummary> =>
    get<NHISummary>('/nhi/summary'),

  create: (body: Partial<NHI>): Promise<NHI> =>
    post<NHI>('/nhi', body),

  update: (id: string, body: Partial<NHI>): Promise<NHI> =>
    put<NHI>(`/nhi/${id}`, body),

  archive: (id: string): Promise<void> =>
    del<void>(`/nhi/${id}`),
}
