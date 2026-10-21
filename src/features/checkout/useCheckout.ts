import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useSession } from '@/features/auth/useAuth'
import { useCart } from '@/features/cart/useCart'
import type { OrderInput, OrderResponse, QuoteResponse } from './types'

export function useQuote(coupon: string, network: QuoteResponse['network']) {
  const session = useSession()
  const cart = useCart()
  return useQuery({
    queryKey: ['quote', session.data?.id, coupon, network, cart.data?.subtotalEth, cart.data?.totalQuantity],
    enabled: Boolean(session.data?.id && cart.data?.items.length),
    staleTime: 0,
    queryFn: async ({ signal }) => {
      const { data } = await api.get<QuoteResponse>('/quote', {
        signal,
        params: { coupon, network },
      })
      return data
    },
    retry: false,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: OrderInput) => {
      const { data } = await api.post<OrderResponse>('/orders', input)
      return data
    },
    onSuccess: order => {
      queryClient.setQueryData(['order', order.userId, order.id], order)
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

export function useOrder(orderId: string) {
  const session = useSession()
  return useQuery<OrderResponse>({
    queryKey: ['order', session.data?.id, orderId],
    enabled: Boolean(session.data?.id),
    refetchInterval: query => query.state.data?.status === 'pending' ? 1_000 : false,
    retry: false,
    queryFn: async ({ signal }) => {
      const { data } = await api.get<OrderResponse>(`/orders/${encodeURIComponent(orderId)}`, { signal })
      return data
    },
  })
}
