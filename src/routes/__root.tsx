import { createRootRoute } from '@tanstack/react-router'
import { SiteShell } from '@/components/layout/SiteShell'
import { NotFoundPage } from '@/pages/NotFoundPage'

export const Route = createRootRoute({
  component: SiteShell,
  notFoundComponent: NotFoundPage,
})
