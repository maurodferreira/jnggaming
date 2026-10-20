import type { Nft } from '@/features/catalog/types'

// Catalog content mirrors the NFT names/prices shown in the Kurio Figma.
// Supply, availability and chain distribution are local demo fixtures, not blockchain data.
export const nfts: Nft[] = [
  { id: '1', network: 'Ethereum', name: 'Emerald Ape #042', collection: 'Arte digital', priceEth: '1.19', available: 50 },
  { id: '2', network: 'Polygon', name: 'Sage Nomad #009', collection: 'Colecionáveis', priceEth: '1.69', available: 30 },
  { id: '3', network: 'Solana', name: 'Neon Vessel #552', collection: 'Arte 3D', priceEth: '1.99', available: 20 },
  { id: '4', network: 'Ethereum', name: 'Cosmic Bloom #118', collection: 'Arte digital', priceEth: '1.29', available: 25 },
  { id: '5', network: 'Polygon', name: 'Violet Nomad #314', collection: 'Colecionáveis', priceEth: '1.39', available: 40 },
  { id: '6', network: 'Ethereum', name: 'Ivory Baron #088', collection: 'Arte 3D', priceEth: '1.79', available: 15 },
  { id: '7', network: 'Solana', name: 'Golden Beat #207', collection: 'Música', priceEth: '0.99', available: 50 },
  { id: '8', network: 'Polygon', name: 'Golden Echo #084', collection: 'Música', priceEth: '0.59', available: 12 },
  { id: '9', network: 'Ethereum', name: 'Golden Signal #160', collection: 'Música', priceEth: '0.39', available: 35 },
  { id: '10', network: 'Solana', name: 'Emerald Light #224', collection: 'Fotografia', priceEth: '0.79', available: 18 },
  { id: '11', network: 'Ethereum', name: 'Neon Origins #101', collection: 'Generativa', priceEth: '2.19', available: 8 },
  { id: '12', network: 'Polygon', name: 'Nomad Archive #020', collection: 'Fotografia', priceEth: '1.09', available: 16 },
  { id: '13', network: 'Solana', name: 'Golden Arcade #055', collection: 'Jogos', priceEth: '0.69', available: 22 },
  { id: '14', network: 'Polygon', name: 'Emerald Access #039', collection: 'Utilidade', priceEth: '0.89', available: 14 },
  { id: '15', network: 'Ethereum', name: 'Neon Membership #777', collection: 'Assinaturas', priceEth: '1.49', available: 10 },
]
