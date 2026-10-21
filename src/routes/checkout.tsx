import { createFileRoute } from '@tanstack/react-router'
import { AccountGate } from '@/components/account/AccountLayout'
import { CheckoutPage } from '@/pages/CheckoutPage'

export const Route = createFileRoute('/checkout')({
  validateSearch: (search: Record<string, unknown>) => ({
    coupon: typeof search.coupon === 'string' ? search.coupon : '',
  }),
  component: () => (
    <AccountGate path="/checkout">
      <CheckoutPage/>
    </AccountGate>
  ),
})
