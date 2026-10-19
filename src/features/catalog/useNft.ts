import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { api } from '@/services/api'
import type { Nft } from './types'

export function useNft(id: string) {
  return useQuery({
    queryKey: ['nfts', 'detail', id],

    queryFn: async ({ signal }) => {
      const { data } = await api.get<Nft>(
        `/nfts/${encodeURIComponent(id)}`,
        { signal }
      )

      return data
    },

    retry: (failureCount, error) => {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 404
      ) {
        return false
      }

      return failureCount < 1
    },
  })
}
