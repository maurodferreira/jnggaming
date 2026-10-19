export interface CartItem {
  id: string
  nftId: string
  editionId: string
  name: string
  editionName: string
  unitPriceEth: string
  available: number
  quantity: number
}

export interface CartResponse {
  items: CartItem[]
  totalQuantity: number
  subtotalEth: string
}

export interface AddCartItemInput {
  nftId: string
  editionId: string
  quantity: number
}
