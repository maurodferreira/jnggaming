import { createFileRoute } from '@tanstack/react-router'
import { AuthPage } from '@/pages/AuthPage'

export const Route = createFileRoute('/register')({
  validateSearch: (search: Record<string, unknown>) => ({
    next: typeof search.next === 'string' && (
      search.next === '/cart' || search.next === '/checkout' || search.next === '/profile' || search.next === '/wallets' || /^\/nft\/[A-Za-z0-9-]+$/.test(search.next)
    ) ? search.next : '/',
    ...(typeof search.coupon === 'string' && /^[A-Za-z0-9_-]{1,32}$/.test(search.coupon)
      ? { coupon: search.coupon.toUpperCase() }
      : {}),
  }),
  component: () => <AuthPage mode="register" />,
})
