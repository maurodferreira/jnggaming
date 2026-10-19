import type { Nft } from '@/features/catalog/types'

// Catalog content mirrors the NFT names/prices shown in the Kurio Figma.
// Supply/availability values are local demo fixtures, not blockchain data.
export const nfts: Nft[] = [
  { id: '1', name: 'Emerald Ape #042', collection: 'Arte digital', priceEth: '1.19', available: 50 },
  { id: '2', name: 'Sage Nomad #009', collection: 'Colecionáveis', priceEth: '1.69', available: 30 },
  { id: '3', name: 'Neon Vessel #552', collection: 'Arte 3D', priceEth: '1.99', available: 20 },
  { id: '4', name: 'Cosmic Bloom #118', collection: 'Arte digital', priceEth: '1.29', available: 25 },
  { id: '5', name: 'Violet Nomad #314', collection: 'Colecionáveis', priceEth: '1.39', available: 40 },
  { id: '6', name: 'Ivory Baron #088', collection: 'Arte 3D', priceEth: '1.79', available: 15 },
  { id: '7', name: 'Golden Beat #207', collection: 'Música', priceEth: '0.99', available: 50 },
  { id: '8', name: 'Golden Echo #084', collection: 'Música', priceEth: '0.59', available: 12 },
  { id: '9', name: 'Golden Signal #160', collection: 'Música', priceEth: '0.39', available: 35 },
  { id: '10', name: 'Emerald Light #224', collection: 'Fotografia', priceEth: '0.79', available: 18 },
  { id: '11', name: 'Neon Origins #101', collection: 'Generativa', priceEth: '2.19', available: 8 },
  { id: '12', name: 'Nomad Archive #020', collection: 'Fotografia', priceEth: '1.09', available: 16 },
  { id: '13', name: 'Golden Arcade #055', collection: 'Jogos', priceEth: '0.69', available: 22 },
  { id: '14', name: 'Emerald Access #039', collection: 'Utilidade', priceEth: '0.89', available: 14 },
  { id: '15', name: 'Neon Membership #777', collection: 'Assinaturas', priceEth: '1.49', available: 10 },
]
