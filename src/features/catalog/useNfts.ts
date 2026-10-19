import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import {
  PAGE_SIZE,
  type CatalogFilters,
  type NftListResponse,
} from './types'

export function useNfts(filters: CatalogFilters) {
  return useQuery({
    queryKey: ['nfts', 'list', filters],

    queryFn: async ({ signal }) => {
      const { data } = await api.get<NftListResponse>(
        '/nfts',
        {
          params: {
            ...filters,
            limit: PAGE_SIZE,
          },
          signal,
        }
      )

      return data
    },
  })
}
