import { post } from './api'
import type { User } from '@/types/user.types'

export interface EmailLoginResponse {
  token: string
  user: User
}

export async function loginWithEmail(email: string, password: string): Promise<EmailLoginResponse> {
  return post<EmailLoginResponse>('/auth/login', { email, password })
}

export async function logoutEmail(): Promise<void> {
  await post('/auth/logout').catch(() => {})
}
