import { get, post, put, del } from './api'
import type { Policy, PolicyFilters } from '@/types/policy.types'

export const policiesService = {
  list: (): Promise<Policy[]> =>
    get<Policy[]>('/policies'),

  getById: (id: string): Promise<Policy> =>
    get<Policy>(`/policies/${id}`),

  create: (body: Omit<Policy, 'policyId' | 'affectedCount' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<Policy> =>
    post<Policy>('/policies', body),

  update: (id: string, body: Partial<Policy>): Promise<Policy> =>
    put<Policy>(`/policies/${id}`, body),

  delete: (id: string): Promise<void> =>
    del<void>(`/policies/${id}`),

  preview: (filters: PolicyFilters): Promise<{ count: number; sample: unknown[] }> =>
    post('/policies/preview', filters),
}
