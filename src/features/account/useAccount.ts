import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useSession } from '@/features/auth/useAuth'
import type {
  CollectorProfile,
  CollectorWallet,
  PasswordChangeInput,
  WalletInput,
} from './types'

export function useProfile() {
  const session = useSession()
  return useQuery({
    queryKey: ['profile', session.data?.id],
    enabled: Boolean(session.data?.id),
    queryFn: async ({ signal }) => {
      const { data } = await api.get<CollectorProfile>('/profile', { signal })
      return data
    },
  })
}

export function useSaveProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<CollectorProfile, 'id'>) => {
      const { data } = await api.patch<CollectorProfile>('/profile', input)
      return data
    },
    onSuccess: profile => {
      queryClient.setQueryData(['profile', profile.id], profile)
      queryClient.setQueryData(['auth', 'session'], {
        id: profile.id,
        name: profile.displayName,
        email: profile.email,
      })
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (input: PasswordChangeInput) => {
      await api.patch('/profile/password', input)
    },
  })
}

export function useWallets() {
  const session = useSession()
  return useQuery({
    queryKey: ['wallets', session.data?.id],
    enabled: Boolean(session.data?.id),
    queryFn: async ({ signal }) => {
      const { data } = await api.get<CollectorWallet[]>('/wallets', { signal })
      return data
    },
  })
}

export function useSaveWallet() {
  const queryClient = useQueryClient()
  const session = useSession()
  return useMutation({
    mutationFn: async (input: WalletInput) => {
      const slot = input.isPrimary ? 'primary' : 'secondary'
      const { data } = await api.put<CollectorWallet[]>(`/wallets/${slot}`, input)
      return data
    },
    onSuccess: wallets => queryClient.setQueryData(['wallets', session.data?.id], wallets),
  })
}

export function useRemoveWallet() {
  const queryClient = useQueryClient()
  const session = useSession()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.delete<CollectorWallet[]>('/wallets/secondary')
      return data
    },
    onSuccess: wallets => queryClient.setQueryData(['wallets', session.data?.id], wallets),
  })
}

export function useFavorites() {
  const session = useSession()
  return useQuery({
    queryKey: ['favorites', session.data?.id],
    enabled: Boolean(session.data?.id),
    queryFn: async ({ signal }) => {
      const { data } = await api.get<string[]>('/favorites', { signal })
      return data
    },
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const session = useSession()
  return useMutation({
    mutationFn: async ({ nftId, isFavorite }: { nftId: string; isFavorite: boolean }) => {
      const { data } = isFavorite
        ? await api.delete<string[]>(`/favorites/${encodeURIComponent(nftId)}`)
        : await api.post<string[]>(`/favorites/${encodeURIComponent(nftId)}`)
      return data
    },
    onSuccess: favorites => queryClient.setQueryData(['favorites', session.data?.id], favorites),
  })
}
