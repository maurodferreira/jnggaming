
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import type { NftListResponse } from './types'

export function useNfts() {
  return useQuery({
    queryKey: ['nfts', 'list'],

    queryFn: async ({ signal }) => {
      const { data } = await api.get<NftListResponse>(
        '/nfts',
        { signal }
      )

      return data
    },
  })
}
