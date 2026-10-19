export interface AccountProfile {
  id: string
  name: string
  email: string
}

export interface AuthSession {
  accessToken: string
  user: AccountProfile
  expiresAt: number
}

export interface SessionResponse {
  user: AccountProfile | null
  expiresAt: number | null
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput extends LoginInput {
  name: string
  confirmPassword: string
}
