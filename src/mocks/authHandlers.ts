import { delay, http, HttpResponse } from 'msw'
import {
  authenticateAccount,
  createSession,
  getUserFromRequest,
  hasAuthHeader,
  registerAccount,
  resetMockAccounts,
  revokeSession,
} from './authStore'
import { mergeGuestCartIntoUser } from './cartStore'
import type { LoginInput, RegisterInput } from '@/features/auth/types'

const validEmail = (value: unknown): value is string =>
  typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const validPassword = (value: unknown): value is string =>
  typeof value === 'string' && value.length >= 8 && value.length <= 100

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    await delay(260)
    const body = await request.json().catch(() => null) as Partial<LoginInput> | null
    if (!body || !validEmail(body.email) || typeof body.password !== 'string') {
      return HttpResponse.json({ message: 'Informe um e-mail e uma senha válidos.' }, { status: 400 })
    }
    const user = await authenticateAccount(body.email, body.password)
    if (!user) {
      return HttpResponse.json({ message: 'E-mail ou senha incorretos.' }, { status: 401 })
    }
    mergeGuestCartIntoUser(user.id)
    return HttpResponse.json(createSession(user))
  }),

  http.post('/api/auth/register', async ({ request }) => {
    await delay(260)
    const body = await request.json().catch(() => null) as Partial<RegisterInput> | null
    if (!body || typeof body.name !== 'string' || body.name.trim().length < 2
      || body.name.trim().length > 60 || !validEmail(body.email)
      || !validPassword(body.password) || body.password !== body.confirmPassword) {
      return HttpResponse.json({
        message: 'Confira seu nome, e-mail e senha (mínimo de 8 caracteres).',
      }, { status: 400 })
    }
    const user = await registerAccount(body.name, body.email, body.password)
    if (!user) return HttpResponse.json({
      message: 'Já existe uma conta com esse e-mail.',
    }, { status: 409 })
    mergeGuestCartIntoUser(user.id)
    return HttpResponse.json(createSession(user), { status: 201 })
  }),

  http.get('/api/auth/session', ({ request }) => {
    const user = getUserFromRequest(request)
    if (hasAuthHeader(request) && !user) {
      return HttpResponse.json({ message: 'Sessão expirada ou inválida.' }, { status: 401 })
    }
    return HttpResponse.json({ user, expiresAt: null })
  }),

  http.post('/api/auth/logout', ({ request }) => {
    revokeSession(request)
    return HttpResponse.json({ success: true })
  }),

  // Test-only reset endpoint, accessible exclusively inside the MSW demo.
  http.post('/api/mock/reset-accounts', () => {
    resetMockAccounts()
    return HttpResponse.json({ reset: true })
  }),
]
