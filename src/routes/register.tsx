import { createFileRoute } from '@tanstack/react-router'
import { AuthPage } from '@/pages/AuthPage'

export const Route = createFileRoute('/register')({
  validateSearch: (search: Record<string, unknown>) => ({
    next: search.next === '/cart' || search.next === '/profile' || search.next === '/wallets' ? search.next : '/',
  }),
  component: () => <AuthPage mode="register" />,
})
