import type { AccountProfile, AuthSession } from '@/features/auth/types'

const USERS_KEY = 'kurio:mock:users:v1'
const SESSIONS_KEY = 'kurio:mock:sessions:v1'
export const TOKEN_KEY = 'kurio:demo:access-token:v1'

const DEMO_PASSWORD = 'KurioDemo123!'
const SESSION_LIFETIME_MS = 60 * 60 * 1000
const encoder = new TextEncoder()

interface StoredUser extends AccountProfile {
  passwordSalt: string
  passwordHash: string
}

interface StoredSession {
  token: string
  userId: string
  expiresAt: number
}

function readArray<T>(key: string): T[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value as T[] : []
  } catch {
    return []
  }
}

function storeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function storeSessions(sessions: StoredSession[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits({
    name: 'PBKDF2',
    hash: 'SHA-256',
    salt: encoder.encode(salt),
    iterations: 60000,
  }, key, 256)
  return Array.from(new Uint8Array(bits), byte => byte.toString(16).padStart(2, '0')).join('')
}

function publicUser(user: StoredUser): AccountProfile {
  return { id: user.id, name: user.name, email: user.email }
}

export async function seedUsers(): Promise<void> {
  if (readArray<StoredUser>(USERS_KEY).length > 0) return
  const samples = [
    { id: 'demo-collector', name: 'Colecionador Kurio', email: 'colecionador@kurio.demo' },
    { id: 'demo-artist', name: 'Artista Kurio', email: 'artista@kurio.demo' },
  ]
  const users: StoredUser[] = []
  for (const sample of samples) {
    const passwordSalt = crypto.randomUUID()
    users.push({
      ...sample,
      passwordSalt,
      passwordHash: await hashPassword(DEMO_PASSWORD, passwordSalt),
    })
  }
  storeUsers(users)
}

export async function registerAccount(name: string, email: string, password: string) {
  await seedUsers()
  const users = readArray<StoredUser>(USERS_KEY)
  const normalizedEmail = email.trim().toLowerCase()
  if (users.some(user => user.email === normalizedEmail)) return null

  const passwordSalt = crypto.randomUUID()
  const user: StoredUser = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    passwordSalt,
    passwordHash: await hashPassword(password, passwordSalt),
  }
  storeUsers([...users, user])
  return publicUser(user)
}

export async function authenticateAccount(email: string, password: string) {
  await seedUsers()
  const user = readArray<StoredUser>(USERS_KEY).find(
    item => item.email === email.trim().toLowerCase(),
  )
  if (!user || await hashPassword(password, user.passwordSalt) !== user.passwordHash) return null
  return publicUser(user)
}

export function createSession(user: AccountProfile): AuthSession {
  const token = crypto.randomUUID()
  const expiresAt = Date.now() + SESSION_LIFETIME_MS
  const sessions = readArray<StoredSession>(SESSIONS_KEY)
    .filter(item => item.expiresAt > Date.now())
  storeSessions([...sessions, { token, userId: user.id, expiresAt }])
  return { accessToken: token, user, expiresAt }
}

export function getUserFromRequest(request: Request): AccountProfile | null {
  const token = request.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1]
  if (!token) return null
  const session = readArray<StoredSession>(SESSIONS_KEY).find(
    item => item.token === token && item.expiresAt > Date.now(),
  )
  if (!session) return null
  const user = readArray<StoredUser>(USERS_KEY).find(item => item.id === session.userId)
  return user ? publicUser(user) : null
}

export function hasAuthHeader(request: Request): boolean {
  return request.headers.has('Authorization')
}

export function revokeSession(request: Request): void {
  const token = request.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1]
  if (!token) return
  storeSessions(readArray<StoredSession>(SESSIONS_KEY).filter(item => item.token !== token))
}

export function resetMockAccounts(): void {
  localStorage.removeItem(USERS_KEY)
  localStorage.removeItem(SESSIONS_KEY)
  localStorage.removeItem(TOKEN_KEY)
}
