import { http, HttpResponse, delay } from 'msw'
import { nfts } from './fixtures/nfts'
import {
  PAGE_SIZE,
  parseCatalogSearch,
} from '@/features/catalog/types'

function ethToWei(value: string): bigint {
  const [whole, fraction = ''] = value.split('.')

  return (
    BigInt(whole) * 10n ** 18n +
    BigInt(fraction.padEnd(18, '0'))
  )
}

export const handlers = [
  http.get('/api/nfts', async ({ request }) => {
    await delay(400)

    const url = new URL(request.url)
    const filters = parseCatalogSearch(
      Object.fromEntries(url.searchParams)
    )

    const requestedLimit = Number(
      url.searchParams.get('limit')
    )

    const limit =
      Number.isInteger(requestedLimit) &&
      requestedLimit >= 1 &&
      requestedLimit <= 20
        ? requestedLimit
        : PAGE_SIZE

    const query = filters.q.trim().toLowerCase()

    let result = nfts.filter((nft) => {
      const matchesSearch =
        nft.name.toLowerCase().includes(query) ||
        nft.collection.toLowerCase().includes(query)

      const matchesCollection =
        filters.collection === 'all' ||
        nft.collection === filters.collection

      const matchesAvailability =
        !filters.available || nft.available > 0

      return (
        matchesSearch &&
        matchesCollection &&
        matchesAvailability
      )
    })

    result = [...result].sort((a, b) => {
      if (filters.sort === 'name_asc') {
        return a.name.localeCompare(b.name)
      }

      const difference =
        ethToWei(a.priceEth) - ethToWei(b.priceEth)

      const comparison =
        difference === 0n ? 0 : difference > 0n ? 1 : -1

      return filters.sort === 'price_desc'
        ? -comparison
        : comparison
    })

    const total = result.length
    const start = (filters.page - 1) * limit

    return HttpResponse.json({
      items: result.slice(start, start + limit),
      total,
      page: filters.page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    })
  }),
]