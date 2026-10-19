import type { CartItem } from '@/features/cart/types'

export interface QuoteResponse {
  id: string
  userId: string
  coupon: string | null
  network: 'Ethereum' | 'Polygon' | 'Solana'
  items: CartItem[]
  subtotalEth: string
  discountEth: string
  feeEth: string
  totalEth: string
  expiresAt: number
  fingerprint: string
}

export interface OrderInput {
  idempotencyKey: string
  quoteId: string
  walletId: string
  provider: 'MetaMask' | 'WalletConnect' | 'Coinbase Wallet'
  notes?: string
}

export interface OrderResponse {
  id: string
  transactionId: string
  userId: string
  status: 'pending' | 'confirmed' | 'declined'
  createdAt: number
  updatedAt: number
  walletId: string
  walletNickname: string
  provider: OrderInput['provider']
  quote: QuoteResponse
  errorMessage?: string
}
