import { get, getPaginated, post, put, del } from './api'
import type { NHI, NHIListParams } from '@/types/nhi.types'
import type { PaginatedResponse } from '@/types/api.types'

export const nhiService = {
  list: (params: NHIListParams): Promise<PaginatedResponse<NHI>> =>
    getPaginated<NHI>('/nhi', params as Record<string, unknown>),

  getById: (id: string): Promise<NHI> =>
    get<NHI>(`/nhi/${id}`),

  create: (body: Partial<NHI>): Promise<NHI> =>
    post<NHI>('/nhi', body),

  update: (id: string, body: Partial<NHI>): Promise<NHI> =>
    put<NHI>(`/nhi/${id}`, body),

  archive: (id: string): Promise<void> =>
    del<void>(`/nhi/${id}`),
}
