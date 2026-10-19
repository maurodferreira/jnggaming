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

    return stored.filter(
      (value): value is AddCartItemInput => {
        if (typeof value !== 'object' || value === null) {
          return false
        }

        const item = value as Record<string, unknown>

        return (
          typeof item.nftId === 'string' &&
          typeof item.editionId === 'string' &&
          typeof item.quantity === 'number' &&
          Number.isSafeInteger(item.quantity) &&
          item.quantity > 0
        )
      }
    )
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
