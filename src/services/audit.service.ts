import { getPaginated } from './api'
import type { PaginatedResponse } from '@/types/api.types'

export interface AuditLogEntry {
  eventId:      string
  resourceId:   string
  resourceType: string
  actorId:      string
  actorRole:    string
  action:       string
  before?:      Record<string, unknown>
  after?:       Record<string, unknown>
  ipAddress:    string
  timestamp:    string
  traceId:      string
}

export const auditService = {
  list: (params?: {
    resourceId?: string
    actorId?:    string
    action?:     string
    from?:       string
    to?:         string
    page?:       number
    limit?:      number
  }): Promise<PaginatedResponse<AuditLogEntry>> =>
    getPaginated<AuditLogEntry>('/audit/logs', params as Record<string, unknown>),
}
