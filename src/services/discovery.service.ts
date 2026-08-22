import { get, getPaginated, post, put } from './api'
import type { DiscoveryRun, ConnectorConfig, ConnectorType } from '@/types/connector.types'
import type { PaginatedResponse } from '@/types/api.types'

export type DiscoveryTriggerPayload = {
  connectors?: ConnectorType[] | 'ALL'
  connectorId?: string
}

export const discoveryService = {
  trigger: (payload: DiscoveryTriggerPayload | ConnectorType[] | 'ALL'): Promise<{ runId: string }> => {
    const body = Array.isArray(payload) || payload === 'ALL'
      ? { connectors: payload }
      : payload
    return post<{ runId: string }>('/discovery/trigger', body)
  },

  getRunStatus: (runId: string): Promise<DiscoveryRun> =>
    get<DiscoveryRun>(`/discovery/runs/${runId}`),

  listRuns: (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<DiscoveryRun>> =>
    getPaginated<DiscoveryRun>('/discovery/runs', params as Record<string, unknown>),

  listConnectors: (): Promise<ConnectorConfig[]> =>
    get<ConnectorConfig[]>('/connectors'),

  getConnector: (id: string): Promise<ConnectorConfig> =>
    get<ConnectorConfig>(`/connectors/${id}`),

  createConnector: (body: Partial<ConnectorConfig>): Promise<ConnectorConfig> =>
    post<ConnectorConfig>('/connectors', body),

  updateConnector: (id: string, body: Partial<Pick<ConnectorConfig, 'displayName' | 'config'>>): Promise<ConnectorConfig> =>
    put<ConnectorConfig>(`/connectors/${id}`, body),

  testConnector: (id: string): Promise<{ connected: boolean; latencyMs: number; error?: string; message?: string }> =>
    post(`/connectors/${id}/test`),

  ingest: (file: File): Promise<{ message: string; count: number }> => {
    const formData = new FormData()
    formData.append('file', file)
    return post('/discovery/ingest', formData)
  },
}
