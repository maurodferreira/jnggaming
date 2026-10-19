import { createFileRoute } from '@tanstack/react-router'
import { AccountGate } from '@/components/account/AccountLayout'
import { WalletsPage } from '@/pages/WalletsPage'

export const Route = createFileRoute('/wallets')({
  component: () => (
    <AccountGate path="/wallets">
      <WalletsPage/>
    </AccountGate>
  ),
})
