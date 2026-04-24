export interface PaginatedResponse<T> {
  items:      T[]
  total:      number
  page:       number
  limit:      number
  totalPages: number
}

export interface ApiResponse<T> {
  data:    T
  message?: string
}

export interface ApiError {
  statusCode: number
  message:    string
  code?:      string
}

export interface PaginationParams {
  page?:  number
  limit?: number
}
