import { createFileRoute } from '@tanstack/react-router'
import { AuthPage } from '@/pages/AuthPage'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    next: typeof search.next === 'string' && (
      search.next === '/cart' || search.next === '/profile' || search.next === '/wallets' || /^\/nft\/[A-Za-z0-9-]+$/.test(search.next)
    ) ? search.next : '/',
  }),
  component: () => <AuthPage mode="login" />,
})
