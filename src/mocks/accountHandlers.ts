import { delay, http, HttpResponse } from 'msw'
import { changeAccountPassword, getUserFromRequest, updateAccount } from './authStore'
import type {
  CollectorProfile,
  CollectorWallet,
  PasswordChangeInput,
  WalletInput,
} from '@/features/account/types'

const unauthorized = () => HttpResponse.json(
  { message: 'Faça login para acessar esta área.' },
  { status: 401 },
)

function profileKey(userId: string) { return `kurio:mock:profile:${userId}:v1` }
function walletKey(userId: string) { return `kurio:mock:wallets:${userId}:v1` }
function favoriteKey(userId: string) { return `kurio:mock:favorites:${userId}:v1` }

function readValue<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

export function resetAccountResources() {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i)
    if (key && /^(kurio:mock:(profile|wallets|favorites):)/.test(key)) localStorage.removeItem(key)
  }
}

function currentProfile(user: { id: string; name: string; email: string }): CollectorProfile {
  const saved = readValue<Partial<CollectorProfile>>(profileKey(user.id), {})
  return {
    id: user.id,
    displayName: user.name,
    username: saved.username || user.name.replace(/\s+/g, '').toLowerCase(),
    email: user.email,
    ensName: saved.ensName || '',
    walletNickname: saved.walletNickname || '',
    avatarDataUrl: saved.avatarDataUrl || null,
  }
}

const emailValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
const addressValid = (network: string, address: string) =>
  network === 'Solana'
    ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
    : /^0x[a-fA-F0-9]{40}$/.test(address)

export const accountHandlers = [
  http.get('/api/profile', ({ request }) => {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()
    return HttpResponse.json(currentProfile(user))
  }),
  http.patch('/api/profile', async ({ request }) => {
    await delay(180)
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()
    const body = await request.json().catch(() => null) as Partial<CollectorProfile> | null
    if (!body || typeof body.displayName !== 'string' || body.displayName.trim().length < 2
      || typeof body.email !== 'string' || !emailValid(body.email)
      || typeof body.username !== 'string' || !/^[a-zA-Z0-9_.]{3,30}$/.test(body.username)
      || typeof body.ensName !== 'string' || body.ensName.length > 64
      || typeof body.walletNickname !== 'string' || body.walletNickname.length > 40
      || (body.avatarDataUrl !== null && body.avatarDataUrl !== undefined &&
        (typeof body.avatarDataUrl !== 'string' ||
          !/^data:image\/(png|jpeg|webp);base64,/.test(body.avatarDataUrl) ||
          body.avatarDataUrl.length > 1_400_000))) {
      return HttpResponse.json({ message: 'Confira os campos do perfil e a imagem (até 1 MB).' }, { status: 400 })
    }

    const changed = await updateAccount(user.id, body.displayName, body.email)
    if (changed === 'conflict') return HttpResponse.json({ message: 'Este e-mail já está cadastrado.' }, { status: 409 })
    if (!changed) return unauthorized()
    const updated = {
      username: body.username,
      ensName: body.ensName,
      walletNickname: body.walletNickname,
      avatarDataUrl: body.avatarDataUrl ?? null,
    }
    localStorage.setItem(profileKey(user.id), JSON.stringify(updated))
    return HttpResponse.json(currentProfile(changed))
  }),
  http.patch('/api/profile/password', async ({ request }) => {
    await delay(180)
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()
    const input = await request.json().catch(() => null) as Partial<PasswordChangeInput> | null
    if (!input || typeof input.currentPassword !== 'string' || typeof input.newPassword !== 'string'
      || input.newPassword.length < 8 || input.newPassword.length > 100
      || input.confirmPassword !== input.newPassword) {
      return HttpResponse.json({ message: 'A nova senha deve ter ao menos 8 caracteres e coincidir com a confirmação.' }, { status: 400 })
    }
    const changed = await changeAccountPassword(user.id, input.currentPassword, input.newPassword)
    if (!changed) return HttpResponse.json({ message: 'Senha atual incorreta.' }, { status: 400 })
    return HttpResponse.json({ changed: true })
  }),

  http.get('/api/wallets', ({ request }) => {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()
    return HttpResponse.json(readValue<CollectorWallet[]>(walletKey(user.id), []))
  }),
  http.put('/api/wallets/:slot', async ({ request, params }) => {
    await delay(180)
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()
    const slot = String(params.slot)
    if (slot !== 'primary' && slot !== 'secondary') return HttpResponse.json({ message: 'Carteira inexistente.' }, { status: 404 })
    const body = await request.json().catch(() => null) as Partial<WalletInput> | null
    if (!body || typeof body.label !== 'string' || body.label.trim().length < 2 || body.label.length > 60
      || typeof body.nickname !== 'string' || body.nickname.trim().length < 2 || body.nickname.length > 40
      || !['Ethereum', 'Polygon', 'Solana'].includes(body.network || '')
      || !['Software', 'Hardware'].includes(body.type || '')
      || typeof body.address !== 'string' || !addressValid(body.network!, body.address)) {
      return HttpResponse.json({ message: 'Preencha os dados da carteira e informe um endereço compatível com a rede.' }, { status: 400 })
    }
    const wallets = readValue<CollectorWallet[]>(walletKey(user.id), [])
    const wallet: CollectorWallet = {
      id: slot,
      label: body.label.trim(),
      nickname: body.nickname.trim(),
      address: body.address,
      network: body.network!,
      type: body.type!,
      isPrimary: slot === 'primary',
    }
    const updated = [...wallets.filter(item => item.id !== slot), wallet]
      .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
    localStorage.setItem(walletKey(user.id), JSON.stringify(updated))
    return HttpResponse.json(updated)
  }),
  http.delete('/api/wallets/:slot', async ({ request, params }) => {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()
    const slot = String(params.slot)
    if (slot !== 'secondary') return HttpResponse.json({ message: 'A carteira principal não pode ser removida aqui.' }, { status: 400 })
    const wallets = readValue<CollectorWallet[]>(walletKey(user.id), [])
      .filter(item => item.id !== slot)
    localStorage.setItem(walletKey(user.id), JSON.stringify(wallets))
    return HttpResponse.json(wallets)
  }),
  http.get('/api/favorites', ({ request }) => {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()
    return HttpResponse.json(readValue<string[]>(favoriteKey(user.id), []))
  }),
  http.post('/api/favorites/:id', ({ request, params }) => {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()
    const id = String(params.id)
    const current = readValue<string[]>(favoriteKey(user.id), [])
    const next = [...new Set([...current, id])]
    localStorage.setItem(favoriteKey(user.id), JSON.stringify(next))
    return HttpResponse.json(next)
  }),
  http.delete('/api/favorites/:id', ({ request, params }) => {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()
    const next = readValue<string[]>(favoriteKey(user.id), [])
      .filter(id => id !== String(params.id))
    localStorage.setItem(favoriteKey(user.id), JSON.stringify(next))
    return HttpResponse.json(next)
  }),
]
