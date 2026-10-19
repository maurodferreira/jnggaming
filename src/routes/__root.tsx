import { createRootRoute } from '@tanstack/react-router'
import { SiteShell } from '@/components/layout/SiteShell'

export const Route = createRootRoute({
  component: SiteShell,
})
