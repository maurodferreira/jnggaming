import type {
  Nft,
  NftEdition,
} from '@/features/catalog/types'
import { ethToWei, weiToEth } from '@/lib/eth'

const COLLECTOR_EXTRA_WEI = 50_000_000_000_000_000n

export function getMockEditions(nft: Nft): NftEdition[] {
  const collectorStock = Math.floor(nft.available / 3)
  const standardStock = nft.available - collectorStock

  return [
    {
      id: 'standard',
      name: 'Standard',
      priceEth: nft.priceEth,
      available: standardStock,
    },
    {
      id: 'collector',
      name: 'Collector',
      priceEth: weiToEth(
        ethToWei(nft.priceEth) + COLLECTOR_EXTRA_WEI
      ),
      available: collectorStock,
    },
  ]
}
