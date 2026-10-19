import { createFileRoute } from '@tanstack/react-router'
import { AuthPage } from '@/pages/AuthPage'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    next: search.next === '/cart' ? '/cart' : '/',
  }),
  component: () => <AuthPage mode="login" />,
})
