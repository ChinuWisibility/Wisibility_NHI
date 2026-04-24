import api from '@/config/axiosInstance'
import type { PaginatedResponse, ApiResponse } from '@/types/api.types'

export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await api.get<ApiResponse<T>>(url, { params })
  return data.data
}

export async function getPaginated<T>(
  url: string,
  params?: Record<string, unknown>,
): Promise<PaginatedResponse<T>> {
  const { data } = await api.get<PaginatedResponse<T>>(url, { params })
  return data
}

export async function post<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.post<ApiResponse<T>>(url, body)
  return data.data
}

export async function put<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.put<ApiResponse<T>>(url, body)
  return data.data
}

export async function del<T>(url: string): Promise<T> {
  const { data } = await api.delete<ApiResponse<T>>(url)
  return data.data
}
