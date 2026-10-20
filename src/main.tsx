
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { routeTree } from './routeTree.gen'
import './index.css'
import { setMockStartup } from './services/mockStartup'

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


function bootstrap() {
  // Mostramos a interface enquanto o MSW instala o Service Worker.
  // Axios e Socket.IO aguardam esta promessa antes de usar a rede.
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'false') {
    const startup = import('./mocks/browser')
      .then(({ worker }) => worker.start())
      .then(() => undefined)
    setMockStartup(startup)
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

bootstrap()
