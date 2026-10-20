import { Navigate, Link, useNavigate, useRouterState } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { LogOut, MapPin, UserRound } from 'lucide-react'
import { useLogout, useSession } from '@/features/auth/useAuth'
import { Skeleton } from '@/components/ui/skeleton'

type ProtectedPath = '/profile' | '/wallets' | '/checkout' | '/cart'

export function AccountGate({ path, children }: { path: ProtectedPath; children: ReactNode }) {
  const session = useSession()
  const checkoutCoupon = useRouterState({
    select: state => {
      const search = state.location.search
      return 'coupon' in search && typeof search.coupon === 'string' ? search.coupon : ''
    },
  })

  if (session.isPending) {
    return (
      <main className="mx-auto max-w-[1200px] space-y-4 px-5 py-12" aria-label="Carregando conta">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </main>
    )
  }
  if (session.isError) {
    return (
      <main className="mx-auto max-w-[1200px] px-5 py-12" role="alert">
        <p>Não foi possível recuperar sua sessão.</p>
        <button onClick={() => void session.refetch()} className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground">Tentar novamente</button>
      </main>
    )
  }
  if (!session.data) return (
    <Navigate
      to="/login"
      search={{ next: path, ...(path === '/checkout' && checkoutCoupon ? { coupon: checkoutCoupon } : {}) }}
      replace
    />
  )
  return <>{children}</>
}

const menuItems: { title: string; to: ProtectedPath; icon: typeof UserRound }[] = [
  { title: 'Dados do perfil', to: '/profile', icon: UserRound },
  { title: 'Carteiras', to: '/wallets', icon: MapPin },
]

export function AccountLayout({ active, children }: { active: ProtectedPath; children: ReactNode }) {
  const logout = useLogout()
  const navigate = useNavigate()

  async function signOut() {
    try {
      await logout.mutateAsync()
    } catch {
      // The local token is cleared even if the demo logout request fails.
    }
    await navigate({ to: '/login', search: { next: '/' }, replace: true })
  }

  return (
    <main className="mx-auto grid max-w-[1248px] gap-5 px-5 py-8 pb-24 md:grid-cols-[245px_minmax(0,1fr)] md:gap-5 md:px-6 md:pb-0 lg:gap-8">
      <aside className="self-start rounded-md bg-[#241612] md:min-h-[360px]">
        <h1 className="px-5 pb-3 pt-5 text-base font-bold">Meu perfil</h1>
        <nav aria-label="Seções da conta" className="flex flex-wrap gap-1 px-2 pb-4 md:flex-col md:gap-0">
          {menuItems.map(item => {
            const Icon = item.icon
            return (
              <Link
                to={item.to}
                key={item.to}
                aria-current={active === item.to ? 'page' : undefined}
                className={`flex items-center gap-2 border-l-[3px] px-3 py-3 text-xs transition-colors md:text-sm ${active === item.to ? 'border-primary bg-[#301d15] font-semibold text-[#e89b55]' : 'border-transparent text-[#cfb28c] hover:text-primary'}`}
              >
                <Icon size={17} aria-hidden="true"/>{item.title}
              </Link>
            )
          })}
          <span className="hidden px-4 py-3 text-xs text-[#cfb28c]/60 md:block">Atividade e ofertas não fazem parte desta entrega.</span>
          <button type="button" onClick={() => void signOut()} disabled={logout.isPending} className="flex items-center gap-2 border-l-[3px] border-transparent px-3 py-3 text-left text-xs text-[#e89b55] hover:underline disabled:opacity-50 md:text-sm">
            <LogOut size={17} aria-hidden="true"/>Sair
          </button>
        </nav>
      </aside>
      <div className="min-w-0 pb-8">{children}</div>
    </main>
  )
}
