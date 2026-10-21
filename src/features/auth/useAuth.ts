import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { api } from '@/services/api'
import type {
  AccountProfile,
  AuthSession,
  LoginInput,
  RegisterInput,
  SessionResponse,
} from './types'

const SESSION_KEY = ['auth', 'session'] as const
const TOKEN_KEY = 'kurio:demo:access-token:v1'

export function useSession() {
  return useQuery({
    queryKey: SESSION_KEY,
    queryFn: async ({ signal }): Promise<AccountProfile | null> => {
      try {
        const { data } = await api.get<SessionResponse>('/auth/session', { signal })
        return data.user
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          localStorage.removeItem(TOKEN_KEY)
          return null
        }
        throw error
      }
    },
    retry: false,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  })
}

function useSessionMutation<T>(path: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: T): Promise<AuthSession> => {
      const { data } = await api.post<AuthSession>(path, input)
      return data
    },
    onSuccess: ({ accessToken, user }) => {
      localStorage.setItem(TOKEN_KEY, accessToken)
      // Remove any guest or previous user's private cache before switching identity.
      queryClient.clear()
      queryClient.setQueryData(SESSION_KEY, user)
    },
  })
}

export function useLogin() {
  return useSessionMutation<LoginInput>('/auth/login')
}

export function useRegister() {
  return useSessionMutation<RegisterInput>('/auth/register')
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout')
    },
    onSettled: () => {
      localStorage.removeItem(TOKEN_KEY)
      queryClient.clear()
      queryClient.setQueryData(SESSION_KEY, null)
    },
  })
}

export function getAuthErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? 'Não foi possível completar a operação.'
  }
  return 'Ocorreu um erro de conexão. Tente novamente.'
}
