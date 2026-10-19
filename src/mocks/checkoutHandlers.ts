import { delay, http, HttpResponse } from 'msw'
import { getUserFromRequest } from './authStore'
import { buildCart, readCart, saveCart } from './cartStore'
import { ethToWei, weiToEth } from '@/lib/eth'
import type { CartItem } from '@/features/cart/types'
import type { CollectorWallet } from '@/features/account/types'
import type { OrderInput, OrderResponse, QuoteResponse } from '@/features/checkout/types'

const FEE_WEI = ethToWei('0.016')
const QUOTE_LIFETIME_MS = 60_000
const ORDER_PENDING_MS = 1_200

const unauthorized = () => HttpResponse.json(
  { message: 'Sua sessão expirou. Entre novamente.' },
  { status: 401 },
)

const quoteKey = (userId: string) => `kurio:mock:quote:${userId}:v1`
const ordersKey = (userId: string) => `kurio:mock:orders:${userId}:v1`
const walletsKey = (userId: string) => `kurio:mock:wallets:${userId}:v1`
const nextOrderKey = (userId: string) => `kurio:mock:next-order:${userId}:v1`
type DemoOutcome = 'declined' | 'network-drop'

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

function saveOrders(userId: string, orders: OrderResponse[]) {
  localStorage.setItem(ordersKey(userId), JSON.stringify(orders))
}

function fingerprintCart(items: CartItem[], coupon: string | null, network: string): string {
  return JSON.stringify({
    items: items.map(item => [
      item.nftId, item.editionId, item.unitPriceEth, item.quantity, item.available,
    ]).sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
    coupon,
    network,
  })
}

function estimateQuote(
  userId: string,
  coupon: string | null,
  network: QuoteResponse['network'],
): QuoteResponse | null {
  const cart = buildCart(userId)
  if (cart.items.length === 0) return null
  if (cart.items.some(item => item.available < item.quantity)) return null
  const subtotalWei = ethToWei(cart.subtotalEth)
  const discountWei = coupon === 'KURIO10' ? subtotalWei / 10n : 0n
  return {
    id: crypto.randomUUID(),
    userId, coupon, network,
    items: cart.items,
    subtotalEth: cart.subtotalEth,
    discountEth: weiToEth(discountWei),
    feeEth: weiToEth(FEE_WEI),
    totalEth: weiToEth(subtotalWei - discountWei + FEE_WEI),
    expiresAt: Date.now() + QUOTE_LIFETIME_MS,
    fingerprint: fingerprintCart(cart.items, coupon, network),
  }
}

function getOrders(userId: string): OrderResponse[] {
  return loadJSON<OrderResponse[]>(ordersKey(userId), [])
}

function orderFingerprint(input: OrderInput): string {
  return JSON.stringify({
    quoteId: input.quoteId,
    walletId: input.walletId,
    provider: input.provider,
    notes: input.notes ?? '',
  })
}

function finalizeOrder(order: OrderResponse): OrderResponse {
  if (order.status !== 'pending' || Date.now() < order.createdAt + ORDER_PENDING_MS) return order
  const declaredFailure = order.simulatedOutcome === 'declined'
  const updated: OrderResponse = {
    ...order,
    status: declaredFailure ? 'declined' : 'confirmed',
    updatedAt: Date.now(),
    ...(declaredFailure ? { errorMessage: 'A carteira recusou a transação simulada.' } : {}),
  }
  if (updated.status === 'confirmed') {
    const current = readCart(order.userId)
    const remaining = current.flatMap(item => {
      const purchased = order.quote.items.find(p => p.nftId === item.nftId && p.editionId === item.editionId)
      if (!purchased) return [item]
      const quantity = item.quantity - purchased.quantity
      return quantity > 0 ? [{ ...item, quantity }] : []
    })
    saveCart(remaining, order.userId)
  }
  const all = getOrders(order.userId)
  saveOrders(order.userId, all.map(item => item.id === order.id ? updated : item))
  return updated
}

export function resetCheckoutResources() {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i)
    if (key && (key.startsWith('kurio:mock:quote:') || key.startsWith('kurio:mock:orders:') || key.startsWith('kurio:mock:next-order:'))) {
      localStorage.removeItem(key)
    }
  }
}

export const checkoutHandlers = [
  // Simulated scenarios for deterministic E2E coverage (never a real payment API).
  http.post('/api/mock/next-order', async ({ request }) => {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()
    const body = await request.json().catch(() => null) as { outcome?: unknown } | null
    if (!body || !['declined', 'network-drop'].includes(String(body.outcome))) {
      return HttpResponse.json({ message: 'Cenário inválido.' }, { status: 400 })
    }
    localStorage.setItem(nextOrderKey(user.id), JSON.stringify(body.outcome))
    return HttpResponse.json({ configured: true })
  }),

  http.get('/api/quote', async ({ request }) => {
    await delay(180)
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()
    const url = new URL(request.url)
    const rawCoupon = url.searchParams.get('coupon')?.trim().toUpperCase() || null
    const rawNetwork = url.searchParams.get('network') || 'Ethereum'
    if (rawCoupon && !['KURIO10', 'EXPIRED'].includes(rawCoupon)) {
      return HttpResponse.json({ message: 'Cupom inválido.' }, { status: 400 })
    }
    if (rawCoupon === 'EXPIRED') {
      return HttpResponse.json({ message: 'Cupom expirado.' }, { status: 410 })
    }
    if (!['Ethereum', 'Polygon', 'Solana'].includes(rawNetwork)) {
      return HttpResponse.json({ message: 'Rede não suportada.' }, { status: 400 })
    }
    const quote = estimateQuote(
      user.id, rawCoupon, rawNetwork as QuoteResponse['network'],
    )
    if (!quote) return HttpResponse.json({
      message: 'Carrinho vazio ou item indisponível. Revise as quantidades.',
    }, { status: 409 })
    // A background refetch must not invalidate an unchanged, unexpired quote.
    const previous = loadJSON<QuoteResponse | null>(quoteKey(user.id), null)
    if (previous && previous.expiresAt > Date.now() &&
        previous.fingerprint === quote.fingerprint && previous.totalEth === quote.totalEth) {
      return HttpResponse.json(previous)
    }
    localStorage.setItem(quoteKey(user.id), JSON.stringify(quote))
    return HttpResponse.json(quote)
  }),

  http.post('/api/orders', async ({ request }) => {
    await delay(300)
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()
    const input = await request.json().catch(() => null) as Partial<OrderInput> | null
    if (!input || typeof input.idempotencyKey !== 'string'
      || !/^[\w-]{12,100}$/.test(input.idempotencyKey)
      || typeof input.quoteId !== 'string'
      || typeof input.walletId !== 'string'
      || !['MetaMask', 'WalletConnect', 'Coinbase Wallet'].includes(input.provider || '')
      || (input.notes !== undefined && (typeof input.notes !== 'string' || input.notes.length > 300))) {
      return HttpResponse.json({ message: 'Confira os dados do pagamento.' }, { status: 400 })
    }
    const payload = input as OrderInput
    const orders = getOrders(user.id)
    const previous = orders.find(item => item.id === payload.idempotencyKey)
    if (previous) {
      if (previous.quote.id !== payload.quoteId || orderFingerprint({
        idempotencyKey: previous.id,
        quoteId: previous.quote.id,
        walletId: previous.walletId,
        provider: previous.provider,
        notes: previous.notes,
      }) !== orderFingerprint(payload)) {
        return HttpResponse.json({ message: 'A chave desta tentativa já foi utilizada com dados diferentes.' }, { status: 409 })
      }
      return HttpResponse.json(finalizeOrder(previous))
    }
    const quote = loadJSON<QuoteResponse | null>(quoteKey(user.id), null)
    if (!quote || quote.id !== payload.quoteId || quote.expiresAt <= Date.now()) {
      return HttpResponse.json({ message: 'A cotação expirou. Revise os valores antes de confirmar.' }, { status: 409 })
    }
    // Two different keys must never purchase the same snapshot twice.
    if (orders.some(item => item.quote.id === quote.id && item.status !== 'declined')) {
      return HttpResponse.json({
        message: 'Este pagamento já está em andamento. Consulte o pedido antes de tentar novamente.',
      }, { status: 409 })
    }
    const current = estimateQuote(user.id, quote.coupon, quote.network)
    if (!current || current.fingerprint !== quote.fingerprint || current.totalEth !== quote.totalEth) {
      return HttpResponse.json({ message: 'Preço ou disponibilidade alterados. Atualize a cotação.' }, { status: 409 })
    }
    const wallets = loadJSON<CollectorWallet[]>(walletsKey(user.id), [])
    const wallet = wallets.find(item => item.id === payload.walletId)
    if (!wallet || wallet.network !== quote.network) {
      return HttpResponse.json({ message: 'Selecione uma carteira cadastrada nesta rede.' }, { status: 409 })
    }
    const now = Date.now()
    const simulatedOutcome = loadJSON<DemoOutcome | null>(nextOrderKey(user.id), null)
    localStorage.removeItem(nextOrderKey(user.id))
    const order: OrderResponse = {
      id: payload.idempotencyKey,
      transactionId: `0x${crypto.randomUUID().replace(/-/g, '')}`,
      userId: user.id,
      status: 'pending',
      simulatedOutcome: simulatedOutcome ?? undefined,
      createdAt: now,
      updatedAt: now,
      walletId: wallet.id,
      walletNickname: wallet.nickname,
      provider: payload.provider!,
      notes: payload.notes,
      quote,
    }
    saveOrders(user.id, [...orders, order])
    // The server has already recorded the order; the simulated network may fail
    // before the client receives its response. Recovery must query this order ID.
    if (simulatedOutcome === 'network-drop') return HttpResponse.error()
    return HttpResponse.json(order, { status: 201 })
  }),

  http.get('/api/orders/:id', async ({ params, request }) => {
    await delay(200)
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()
    const order = getOrders(user.id).find(item => item.id === params.id)
    if (!order) return HttpResponse.json({ message: 'Pedido não encontrado.' }, { status: 404 })
    return HttpResponse.json(finalizeOrder(order))
  }),
]
