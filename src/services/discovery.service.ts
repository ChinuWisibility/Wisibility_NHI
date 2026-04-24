import { get, getPaginated, post } from './api'
import type { DiscoveryRun, ConnectorConfig, ConnectorType } from '@/types/connector.types'
import type { PaginatedResponse } from '@/types/api.types'

export const discoveryService = {
  trigger: (connectors: ConnectorType[] | 'ALL'): Promise<{ runId: string }> =>
    post<{ runId: string }>('/discovery/trigger', { connectors }),

  getRunStatus: (runId: string): Promise<DiscoveryRun> =>
    get<DiscoveryRun>(`/discovery/runs/${runId}`),

  listRuns: (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<DiscoveryRun>> =>
    getPaginated<DiscoveryRun>('/discovery/runs', params as Record<string, unknown>),

  listConnectors: (): Promise<ConnectorConfig[]> =>
    get<ConnectorConfig[]>('/connectors'),

  createConnector: (body: Partial<ConnectorConfig>): Promise<ConnectorConfig> =>
    post<ConnectorConfig>('/connectors', body),

  testConnector: (id: string): Promise<{ connected: boolean; latencyMs: number; error?: string }> =>
    post(`/connectors/${id}/test`),
}
