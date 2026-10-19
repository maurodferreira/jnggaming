import { http, HttpResponse, delay } from 'msw'
import { nfts } from './fixtures/nfts'
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

export const cartHandlers = [
  http.post('/api/mock/reset', () => {
    resetGuestCart()
    return HttpResponse.json({ reset: true })
  }),

  // Consultar carrinho
  http.get('/api/cart', async () => {
    await delay(200)

    return HttpResponse.json(buildCart())
  }),

  // Adicionar itens
  http.post('/api/cart/items', async ({ request }) => {
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

    const items = readCart()

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
      saveCart(items)
    } else {
      saveCart([...items, body])
    }

    return HttpResponse.json(
      buildCart(),
      { status: 201 }
    )
  }),

  // Atualizar quantidade
  http.patch(
    '/api/cart/items/:id',
    async ({ params, request }) => {
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

      const items = readCart()
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
      saveCart(items)

      return HttpResponse.json(buildCart())
    }
  ),

  // Remover item
  http.delete('/api/cart/items/:id', async ({ params }) => {
    await delay(200)

    const id = String(params.id)
    const items = readCart()

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

    saveCart(remaining)

    return HttpResponse.json(buildCart())
  }),
]
