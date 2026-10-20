
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { routeTree } from './routeTree.gen'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

// Clearing the account cache also prevents an expired session's private
// REST data from being rendered after the user is sent back to login.
window.addEventListener('kurio:session-expired', () => {
  // Keep the active auth query observer mounted so AccountGate receives null
  // and can navigate to login. Invalidate all other user-scoped cache data.
  queryClient.removeQueries({
    predicate: query => query.queryKey[0] !== 'auth',
  })
  queryClient.setQueryData(['auth', 'session'], null)
})

const router = createRouter({
  routeTree,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}


async function bootstrap() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'false') {
    const { worker } = await import('./mocks/browser')

    await worker.start()
  }

  const rootElement = document.getElementById('root')

  if (!rootElement) {
    throw new Error('Elemento root não encontrado')
  }

  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
}

void bootstrap()
