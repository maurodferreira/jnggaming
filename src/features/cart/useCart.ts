import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import axios from 'axios'
import { ethToWei, weiToEth } from '@/lib/eth'

import { api } from '@/services/api'
import { useSession } from '@/features/auth/useAuth'
import type {
  AddCartItemInput,
  CartResponse,
} from './types'

const cartQueryKey = (accountId: string) => ['cart', accountId] as const

function useCartKey() {
  const session = useSession()
  return {
    queryKey: cartQueryKey(session.data?.id ?? 'guest'),
    sessionPending: session.isPending,
  }
}

export function useCart() {
  const { queryKey, sessionPending } = useCartKey()
  return useQuery({
    queryKey,
    enabled: !sessionPending,
    queryFn: async ({ signal }) => {
      const { data } = await api.get<CartResponse>(
        '/cart',
        { signal }
      )

      return data
    },
  })
}

export interface CartSummary {
  coupon: string | null
  totalQuantity: number
  subtotalEth: string
  discountEth: string
  feeEth: string
  totalEth: string
}

export function useCartSummary(coupon: string) {
  const cart = useCart()
  const session = useSession()
  return useQuery({
    queryKey: [
      'cart-summary',
      session.data?.id ?? 'guest',
      coupon,
      cart.data?.items.map(item => [item.id, item.quantity, item.unitPriceEth, item.available]),
    ],
    enabled: !session.isPending && Boolean(cart.data?.items.length),
    retry: false,
    queryFn: async ({ signal }) => {
      const { data } = await api.get<CartSummary>('/cart/summary', {
        signal,
        params: { coupon },
      })
      return data
    },
  })
}

export function useAddToCart() {
  const queryClient = useQueryClient()
  const { queryKey } = useCartKey()

  return useMutation({
    mutationFn: async (input: AddCartItemInput) => {
      const { data } = await api.post<CartResponse>(
        '/cart/items',
        input
      )

      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data)
      void queryClient.invalidateQueries({
        queryKey,
      })
    },
  })
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient()
  const { queryKey } = useCartKey()

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
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<CartResponse>(queryKey)

      if (previous) {
        const items = previous.items.map((item) =>
          item.id === id ? { ...item, quantity } : item
        )

        queryClient.setQueryData<CartResponse>(queryKey, {
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
        queryClient.setQueryData(queryKey, context.previous)
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey })
    },
  })
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient()
  const { queryKey } = useCartKey()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<CartResponse>(
        `/cart/items/${encodeURIComponent(id)}`
      )

      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data)
      void queryClient.invalidateQueries({
        queryKey,
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
