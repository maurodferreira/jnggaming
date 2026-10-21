export type NftNetwork = 'Ethereum' | 'Polygon' | 'Solana'
export type CatalogNetwork = NftNetwork | 'all'

export interface Nft {
    network: NftNetwork
    id: string
    name: string
    collection: string
    priceEth: string
    available: number
}

export type CatalogSort =
    | 'featured'
    | 'newest'
    | 'trending'
    | 'name_asc'
    | 'price_asc'
    | 'price_desc'

export interface CatalogFilters {
    q: string
    collection: string
    available: boolean
    network?: CatalogNetwork
    minPriceEth?: string
    maxPriceEth?: string
    sort: CatalogSort
    page: number
}

export interface NftListResponse {
    items: Nft[]
    total: number
    page: number
    pageSize: number
    totalPages: number
}

export const PAGE_SIZE = 9

/** Decimal ETH filters use strings, just like our REST prices and bigint quotes. */
export function normalizeEthFilter(value: unknown): string {
    if (typeof value !== 'string') return ''
    const decimal = value.trim().replace(',', '.')
    if (!/^\d{1,6}(?:\.\d{1,18})?$/.test(decimal)) return ''
    return decimal
}

export function parseCatalogSearch(
    search: Record<string, unknown>
): CatalogFilters {
    const page = Number(search.page)

    const sort: CatalogSort =
        search.sort === 'price_asc' ||
            search.sort === 'price_desc' ||
            search.sort === 'name_asc' ||
            search.sort === 'newest' ||
            search.sort === 'trending' ||
            search.sort === 'featured'
            ? search.sort
            : 'featured'

    return {
        q: typeof search.q === 'string'
            ? search.q.slice(0, 100)
            : '',
        collection: typeof search.collection === 'string'
            ? search.collection
            : 'all',
        available:
            search.available === true ||
            search.available === 'true',
        network: search.network === 'Ethereum' || search.network === 'Polygon' || search.network === 'Solana' ? search.network : 'all',
        minPriceEth: normalizeEthFilter(search.minPriceEth),
        maxPriceEth: normalizeEthFilter(search.maxPriceEth),
        sort,
        page:
            Number.isSafeInteger(page) && page > 0 && page <= 1000
                ? page
                : 1,
    }
}

export interface NftEdition {
    id: string
    name: string
    priceEth: string
    available: number
}

export interface NftDetailMetadata {
    tokenId: string
    collectionLabel: string
    description: string
    attributes: string[]
    reviewSummary?: {
        average: number
        count: number
    }
}

export interface NftDetail extends Nft {
    editions: NftEdition[]
    metadata: NftDetailMetadata
}
