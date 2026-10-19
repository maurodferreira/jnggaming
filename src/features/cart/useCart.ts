import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import axios from 'axios'

import { api } from '@/services/api'
import type {
  AddCartItemInput,
  CartResponse,
} from './types'

const cartQueryKey = ['cart', 'guest'] as const

export function useCart() {
  return useQuery({
    queryKey: cartQueryKey,
    queryFn: async ({ signal }) => {
      const { data } = await api.get<CartResponse>(
        '/cart',
        { signal }
      )

      return data
    },
  })
}

export function useAddToCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: AddCartItemInput) => {
      const { data } = await api.post<CartResponse>(
        '/cart/items',
        input
      )

      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(cartQueryKey, data)
      void queryClient.invalidateQueries({
        queryKey: cartQueryKey,
      })
    },
  })
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      quantity,
    }: {
      id: string
      quantity: number
    }) => {
      const { data } = await api.patch<CartResponse>(
        `/cart/items/${encodeURIComponent(id)}`,
        { quantity }
      )

      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(cartQueryKey, data)
      void queryClient.invalidateQueries({
        queryKey: cartQueryKey,
      })
    },
  })
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<CartResponse>(
        `/cart/items/${encodeURIComponent(id)}`
      )

      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(cartQueryKey, data)
      void queryClient.invalidateQueries({
        queryKey: cartQueryKey,
      })
    },
  })
}

export function getCartErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ??
      'Não foi possível concluir a operação.'
    )
  }

  return 'Ocorreu um erro inesperado. Tente novamente.'
}
