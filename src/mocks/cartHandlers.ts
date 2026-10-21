import { http, HttpResponse, delay } from 'msw'
import { nfts } from './fixtures/nfts'
import { calculateCartSummary } from './checkoutHandlers'
import { getUserFromRequest, hasAuthHeader } from './authStore'
import { getMockEditions } from './fixtures/editions'
import {
  readCart,
  saveCart,
  buildCart,
  resetGuestCart,
} from './cartStore'
import type { AddCartItemInput } from '@/features/cart/types'

function validQuantity(
  value: unknown
): value is number {
  return (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value > 0
  )
}

function validCartInput(
  value: unknown
): value is AddCartItemInput {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const item = value as Record<string, unknown>

  return (
    typeof item.nftId === 'string' &&
    typeof item.editionId === 'string' &&
    validQuantity(item.quantity)
  )
}

function getEdition(nftId: string, editionId: string) {
  const nft = nfts.find((item) => item.id === nftId)

  if (!nft) return undefined

  return getMockEditions(nft).find(
    (edition) => edition.id === editionId
  )
}

function cartOwner(request: Request): string | null {
  if (!hasAuthHeader(request)) return 'guest'
  return getUserFromRequest(request)?.id ?? null
}

const unauthorized = () => HttpResponse.json(
  { message: 'A sessão expirou. Entre novamente para continuar.' },
  { status: 401 },
)

export const cartHandlers = [
  http.post('/api/mock/reset', () => {
    resetGuestCart()
    return HttpResponse.json({ reset: true })
  }),

  // Preview estimates for guests and signed-in collectors use exactly the
  // same pricing math as the final authenticated quote.
  http.get('/api/cart/summary', async ({ request }) => {
    const ownerId = cartOwner(request)
    if (!ownerId) return unauthorized()
    await delay(180)
    const coupon = new URL(request.url).searchParams.get('coupon')?.trim().toUpperCase() || null
    if (coupon && !['KURIO10', 'EXPIRED'].includes(coupon)) {
      return HttpResponse.json({ message: 'Cupom inválido.' }, { status: 400 })
    }
    if (coupon === 'EXPIRED') {
      return HttpResponse.json({ message: 'Cupom expirado.' }, { status: 410 })
    }
    const cart = buildCart(ownerId)
    if (cart.items.length === 0 || cart.items.some(item => item.available < item.quantity)) {
      return HttpResponse.json({ message: 'Carrinho vazio ou item indisponível. Revise as quantidades.' }, { status: 409 })
    }
    return HttpResponse.json({
      coupon,
      totalQuantity: cart.totalQuantity,
      ...calculateCartSummary(cart.subtotalEth, coupon),
    })
  }),

  // Consultar carrinho
  http.get('/api/cart', async ({ request }) => {
    const ownerId = cartOwner(request)
    if (!ownerId) return unauthorized()
    await delay(200)

    return HttpResponse.json(buildCart(ownerId))
  }),

  // Adicionar itens
  http.post('/api/cart/items', async ({ request }) => {
    const ownerId = cartOwner(request)
    if (!ownerId) return unauthorized()
    await delay(200)

    const body: unknown = await request
      .json()
      .catch(() => null)

    if (!validCartInput(body)) {
      return HttpResponse.json(
        { message: 'Dados do item inválidos' },
        { status: 400 }
      )
    }

    const edition = getEdition(
      body.nftId,
      body.editionId
    )

    if (!edition) {
      return HttpResponse.json(
        { message: 'Edição não encontrada' },
        { status: 404 }
      )
    }

    const items = readCart(ownerId)

    const existing = items.find(
      (item) =>
        item.nftId === body.nftId &&
        item.editionId === body.editionId
    )

    const newQuantity =
      (existing?.quantity ?? 0) + body.quantity

    if (!Number.isSafeInteger(newQuantity) || newQuantity > edition.available) {
      return HttpResponse.json(
        {
          message: 'Quantidade indisponível',
          available: edition.available,
        },
        { status: 409 }
      )
    }

    if (existing) {
      existing.quantity = newQuantity
      saveCart(items, ownerId)
    } else {
      saveCart([...items, body], ownerId)
    }

    return HttpResponse.json(
      buildCart(ownerId),
      { status: 201 }
    )
  }),

  // Atualizar quantidade
  http.patch(
    '/api/cart/items/:id',
    async ({ params, request }) => {
      const ownerId = cartOwner(request)
      if (!ownerId) return unauthorized()
      await delay(200)

      const body: unknown = await request
        .json()
        .catch(() => null)

      const quantity =
        typeof body === 'object' &&
        body !== null &&
        'quantity' in body
          ? body.quantity
          : undefined

      if (!validQuantity(quantity)) {
        return HttpResponse.json(
          { message: 'Quantidade inválida' },
          { status: 400 }
        )
      }

      const items = readCart(ownerId)
      const id = String(params.id)

      const existing = items.find(
        (item) =>
          `${item.nftId}-${item.editionId}` === id
      )

      if (!existing) {
        return HttpResponse.json(
          { message: 'Item não encontrado' },
          { status: 404 }
        )
      }

      const edition = getEdition(
        existing.nftId,
        existing.editionId
      )

      if (!edition || quantity > edition.available) {
        return HttpResponse.json(
          {
            message: 'Quantidade indisponível',
            available: edition?.available ?? 0,
          },
          { status: 409 }
        )
      }

      existing.quantity = quantity
      saveCart(items, ownerId)

      return HttpResponse.json(buildCart(ownerId))
    }
  ),

  // Remover item
  http.delete('/api/cart/items/:id', async ({ params, request }) => {
    const ownerId = cartOwner(request)
    if (!ownerId) return unauthorized()
    await delay(200)

    const id = String(params.id)
    const items = readCart(ownerId)

    const remaining = items.filter(
      (item) =>
        `${item.nftId}-${item.editionId}` !== id
    )

    if (remaining.length === items.length) {
      return HttpResponse.json(
        { message: 'Item não encontrado' },
        { status: 404 }
      )
    }

    saveCart(remaining, ownerId)

    return HttpResponse.json(buildCart(ownerId))
  }),
]
