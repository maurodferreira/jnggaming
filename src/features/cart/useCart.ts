import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import axios from 'axios'
import { ethToWei, weiToEth } from '@/lib/eth'

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
    onMutate: async ({ id, quantity }) => {
      await queryClient.cancelQueries({ queryKey: cartQueryKey })
      const previous = queryClient.getQueryData<CartResponse>(cartQueryKey)

      if (previous) {
        const items = previous.items.map((item) =>
          item.id === id ? { ...item, quantity } : item
        )

        queryClient.setQueryData<CartResponse>(cartQueryKey, {
          ...previous,
          items,
          totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
          subtotalEth: weiToEth(
            items.reduce(
              (sum, item) =>
                sum + ethToWei(item.unitPriceEth) * BigInt(item.quantity),
              0n
            )
          ),
        })
      }

      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(cartQueryKey, context.previous)
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(cartQueryKey, data)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: cartQueryKey })
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
