import { createFileRoute } from '@tanstack/react-router'
import { AccountGate } from '@/components/account/AccountLayout'
import { OrderPage } from '@/pages/OrderPage'

export const Route = createFileRoute('/orders/$orderId')({
  component: () => (
    <AccountGate path="/cart">
      <OrderPage/>
    </AccountGate>
  ),
})
