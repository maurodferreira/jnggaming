export interface Nft {
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

export interface NftDetail extends Nft {
    editions: NftEdition[]
}
