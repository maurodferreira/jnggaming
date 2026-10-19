import { nfts } from './fixtures/nfts'
import { getMockEditions } from './fixtures/editions'
import { ethToWei, weiToEth } from '@/lib/eth'
import type {
  CartItem,
  CartResponse,
  AddCartItemInput,
} from '@/features/cart/types'

const GUEST_CART_KEY = 'jnggaming:guest-cart:v1'
const storageKey = (ownerId: string) =>
  ownerId === 'guest' ? GUEST_CART_KEY : `kurio:mock:cart:${ownerId}:v1`

export function readCart(ownerId = 'guest'): AddCartItemInput[] {
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem(storageKey(ownerId)) ?? '[]'
    )
    if (!Array.isArray(stored)) return []

    const unique = new Map<string, AddCartItemInput>()
    for (const value of stored) {
      if (typeof value !== 'object' || value === null) continue
      const item = value as Record<string, unknown>
      if (
        typeof item.nftId !== 'string' || !item.nftId ||
        typeof item.editionId !== 'string' || !item.editionId ||
        typeof item.quantity !== 'number' ||
        !Number.isSafeInteger(item.quantity) || item.quantity <= 0
      ) continue

      const key = JSON.stringify([item.nftId, item.editionId])
      if (!unique.has(key)) {
        unique.set(key, {
          nftId: item.nftId,
          editionId: item.editionId,
          quantity: item.quantity,
        })
      }
    }
    return [...unique.values()]
  } catch {
    return []
  }
}

export function saveCart(items: AddCartItemInput[], ownerId = 'guest') {
  localStorage.setItem(
    storageKey(ownerId),
    JSON.stringify(items)
  )
}

export function resetGuestCart() {
  localStorage.removeItem(GUEST_CART_KEY)
}

export function buildCart(ownerId = 'guest'): CartResponse {
  const items: CartItem[] = []

  for (const saved of readCart(ownerId)) {
    const nft = nfts.find(
      (item) => item.id === saved.nftId
    )

    if (!nft) continue

    const edition = getMockEditions(nft).find(
      (item) => item.id === saved.editionId
    )

    if (!edition) continue

    items.push({
      id: `${nft.id}-${edition.id}`,
      nftId: nft.id,
      editionId: edition.id,
      name: nft.name,
      editionName: edition.name,
      unitPriceEth: edition.priceEth,
      available: edition.available,
      quantity: saved.quantity,
    })
  }

  const subtotalWei = items.reduce(
    (total, item) =>
      total +
      ethToWei(item.unitPriceEth) *
        BigInt(item.quantity),
    0n
  )

  return {
    items,
    totalQuantity: items.reduce(
      (total, item) => total + item.quantity,
      0
    ),
    subtotalEth: weiToEth(subtotalWei),
  }
}

/** Move guest items to the signed-in cart without exceeding edition availability. */
export function mergeGuestCartIntoUser(userId: string): void {
  const combined = new Map<string, AddCartItemInput>()
  for (const item of [...readCart(userId), ...readCart('guest')]) {
    const nft = nfts.find(entry => entry.id === item.nftId)
    const edition = nft && getMockEditions(nft).find(entry => entry.id === item.editionId)
    if (!edition || edition.available <= 0) continue
    const key = `${item.nftId}:${item.editionId}`
    const current = combined.get(key)
    const quantity = Math.min(edition.available, (current?.quantity ?? 0) + item.quantity)
    combined.set(key, { nftId: item.nftId, editionId: item.editionId, quantity })
  }
  saveCart([...combined.values()], userId)
  resetGuestCart()
}
