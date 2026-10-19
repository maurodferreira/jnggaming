import { nfts } from './fixtures/nfts'
import { getMockEditions } from './fixtures/editions'
import { ethToWei, weiToEth } from '@/lib/eth'
import type {
  CartItem,
  CartResponse,
  AddCartItemInput,
} from '@/features/cart/types'

const STORAGE_KEY = 'jnggaming:guest-cart:v1'

export function readCart(): AddCartItemInput[] {
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '[]'
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

export function saveCart(items: AddCartItemInput[]) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(items)
  )
}

export function resetGuestCart() {
  localStorage.removeItem(STORAGE_KEY)
}

export function buildCart(): CartResponse {
  const items: CartItem[] = []

  for (const saved of readCart()) {
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
