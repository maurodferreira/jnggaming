import { createFileRoute } from '@tanstack/react-router'
import { AccountGate } from '@/components/account/AccountLayout'
import { CheckoutPage } from '@/pages/CheckoutPage'

export const Route = createFileRoute('/checkout')({
  component: () => (
    <AccountGate path="/checkout">
      <CheckoutPage/>
    </AccountGate>
  ),
})
