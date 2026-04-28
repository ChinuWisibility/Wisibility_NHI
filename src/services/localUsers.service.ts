import type { UserRole } from '@/types/user.types'

export interface LocalUser {
  id:           string
  email:        string
  passwordHash: string
  name:         string
  role:         UserRole
  createdAt:    string
}

const STORAGE_KEY = 'nhi-local-users'

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password)
  const buf  = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function load(): LocalUser[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function save(users: LocalUser[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
}

export function getAllLocalUsers(): LocalUser[] {
  return load()
}

export function findLocalUserByEmail(email: string): LocalUser | undefined {
  return load().find((u) => u.email.toLowerCase() === email.toLowerCase())
}

export async function createLocalUser(
  name: string,
  email: string,
  password: string,
  role: UserRole,
): Promise<LocalUser> {
  const users = load()
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('An account with this email already exists')
  }
  const user: LocalUser = {
    id:           crypto.randomUUID(),
    email:        email.toLowerCase().trim(),
    passwordHash: await hashPassword(password),
    name:         name.trim(),
    role,
    createdAt:    new Date().toISOString(),
  }
  save([...users, user])
  return user
}

export async function verifyLocalUser(
  email: string,
  password: string,
): Promise<LocalUser | null> {
  const user = findLocalUserByEmail(email)
  if (!user) return null
  const hash = await hashPassword(password)
  return hash === user.passwordHash ? user : null
}

export function deleteLocalUser(id: string) {
  save(load().filter((u) => u.id !== id))
}
