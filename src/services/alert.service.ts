import { get, getPaginated, post } from './api'
import type { Alert, AlertSeverity, AlertStatus } from '@/types/alert.types'
import type { PaginatedResponse } from '@/types/api.types'

export interface AlertFilters {
  severity?: AlertSeverity[]
  status?:   AlertStatus
  nhiId?:    string
  page?:     number
  limit?:    number
}

export const alertService = {
  list: (filters?: AlertFilters): Promise<PaginatedResponse<Alert>> =>
    getPaginated<Alert>('/alerts', filters as Record<string, unknown>),

  getById: (alertId: string): Promise<Alert & { nhi?: unknown }> =>
    get<Alert & { nhi?: unknown }>(`/alerts/${alertId}`),

  dismiss: (alertId: string, justification: string): Promise<void> =>
    post<void>(`/alerts/${alertId}/dismiss`, { justification }),

  escalate: (alertId: string): Promise<void> =>
    post<void>(`/alerts/${alertId}/escalate`),
}
