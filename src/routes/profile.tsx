import { createFileRoute } from '@tanstack/react-router'
import { AccountGate } from '@/components/account/AccountLayout'
import { ProfilePage } from '@/pages/ProfilePage'

export const Route = createFileRoute('/profile')({
  component: () => (
    <AccountGate path="/profile">
      <ProfilePage/>
    </AccountGate>
  ),
})
