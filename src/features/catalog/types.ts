export interface Nft {
  id: string
  name: string
  collection: string
  priceEth: string
  available: number
}

export interface NftListResponse {
  items: Nft[]
  total: number
}
