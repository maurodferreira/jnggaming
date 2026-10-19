import { http, HttpResponse, delay } from 'msw'
import { cartHandlers } from './cartHandlers'
import { nfts } from './fixtures/nfts'
import { getMockEditions } from './fixtures/editions'
import { ethToWei } from '@/lib/eth'
import {
    PAGE_SIZE,
    parseCatalogSearch,
    type NftDetail,
} from '@/features/catalog/types'

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

        // Featured follows the Figma's hand-curated order of the fixture list.
        if (filters.sort !== 'featured') {
            const trendingOrder = ['1', '3', '7', '2', '6', '4', '9', '5', '8']
            result = [...result].sort((a, b) => {
                if (filters.sort === 'name_asc') {
                    return a.name.localeCompare(b.name)
                }
                if (filters.sort === 'newest') {
                    return Number(b.id) - Number(a.id)
                }
                if (filters.sort === 'trending') {
                    const rank = (id: string) => {
                        const index = trendingOrder.indexOf(id)
                        return index === -1 ? 100 + Number(id) : index
                    }
                    return rank(a.id) - rank(b.id)
                }

                const difference = ethToWei(a.priceEth) - ethToWei(b.priceEth)
                const comparison = difference === 0n ? 0 : difference > 0n ? 1 : -1
                return filters.sort === 'price_desc' ? -comparison : comparison
            })
        }

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

    // Detalhes de um NFT
    http.get('/api/nfts/:id', async ({ params }) => {
        await delay(400)

        const nft = nfts.find(
            (item) => item.id === params.id
        )

        if (!nft) {
            return HttpResponse.json(
                { message: 'NFT não encontrado' },
                { status: 404 }
            )
        }

        const detail: NftDetail = {
            ...nft,
            editions: getMockEditions(nft),
        }

        return HttpResponse.json(detail)
    }),
    ...cartHandlers,
]
