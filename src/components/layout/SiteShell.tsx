import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { Heart, House, LogOut, Search, ShoppingCart, UserRound } from 'lucide-react'
import { useLogout, useSession } from '@/features/auth/useAuth'
import { useRealtime } from '@/features/realtime/useRealtime'
import { useCart } from '@/features/cart/useCart'
import { Brand } from './Brand'

const defaultCatalogSearch = {
  q: '',
  collection: 'all',
  available: false,
  sort: 'featured' as const,
  page: 1,
}

export function SiteShell() {
  const pathname = useRouterState({ select: state => state.location.pathname })
  const realtimeNotice = useRealtime()
  const { data: cart } = useCart()
  const { data: user } = useSession()
  const logout = useLogout()
  const isAuthPage = pathname === '/login' || pathname === '/register'
  const quantity = cart?.totalQuantity ?? 0

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#main-content" className="sr-only fixed left-4 top-4 z-[100] rounded-md bg-primary px-5 py-3 font-bold text-primary-foreground focus:not-sr-only focus:outline-2 focus:outline-offset-2 focus:outline-primary">Pular para o conteúdo principal</a>
      {!isAuthPage && <header className="mx-auto hidden w-full max-w-[1248px] px-6 pt-6 lg:block">
        <div className="flex min-h-[45px] items-start justify-between gap-5 border-b border-[#674332]">
          <Brand />
          <nav aria-label="Navegação principal" className="flex items-center gap-9 text-sm">
            <Link to="/" search={defaultCatalogSearch} className={pathname === '/' ? 'border-b-2 border-primary pb-3 font-bold text-[#e89b55]' : 'pb-3 hover:text-primary'}>
              Início
            </Link>
            <Link to="/" hash="market" search={defaultCatalogSearch} className="pb-3 transition-colors hover:text-primary">Mercado</Link>
            <span title="Disponível em uma próxima etapa" className="pb-3 text-muted-foreground">Criadores</span>
            <Link to="/" hash="learn" search={defaultCatalogSearch} className="pb-3 transition-colors hover:text-primary">Aprenda</Link>
          </nav>
          <div className="flex items-center gap-7">
            <Link to="/" hash="market" search={defaultCatalogSearch} aria-label="Explorar o catálogo" className="hover:text-primary">
              <Search size={19} strokeWidth={1.7} />
            </Link>
            <Link to="/cart" aria-label={`Abrir carrinho, ${quantity} itens`} className="relative hover:text-primary">
              <ShoppingCart size={22} strokeWidth={1.7} />
              {quantity > 0 && (
                <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {quantity}
                </span>
              )}
            </Link>
            {user ? (
              <div className="flex items-center gap-3 text-xs">
                <Link to="/profile" className="max-w-32 truncate text-[#cfb28c] hover:text-primary" title={user.email}>{user.name}</Link>
                <button type="button" disabled={logout.isPending} onClick={() => logout.mutate()} className="flex items-center gap-1.5 rounded-md border border-[#624230] px-3 py-2 hover:text-primary disabled:opacity-50" aria-label="Sair da conta">
                  <LogOut size={17}/> Sair
                </button>
              </div>
            ) : (
              <Link to="/login" search={{ next: pathname === '/cart' ? '/cart' : '/' }} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-[#e89b55]">
                <UserRound size={17}/> Entrar
              </Link>
            )}
          </div>
        </div>
      </header>}

      {realtimeNotice && <p className="mx-auto max-w-[1248px] px-5 pt-3 text-xs text-[#e89b55]" role="status" aria-live="polite">{realtimeNotice}</p>}
      <div id="main-content" tabIndex={-1} className="outline-none focus-visible:outline-none">
        <Outlet />
      </div>

      {!isAuthPage && <footer className="mt-24 hidden bg-[#241612] px-6 py-12 lg:block">
        <div className="mx-auto grid max-w-[1200px] gap-14 border-b border-[#674332] pb-10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <p className="font-bold tracking-[0.18em]">KURIO</p>
            <p className="text-sm leading-7 text-muted-foreground">Arte e cultura digital cuidadosamente selecionadas para colecionadores curiosos.</p>
          </div>
          <div className="space-y-3 text-sm">
            <p className="font-bold">Explore</p>
            <Link to="/" hash="market" search={defaultCatalogSearch} className="block text-muted-foreground hover:text-primary">Mercado de NFTs</Link>
            <Link to="/cart" className="block text-muted-foreground hover:text-primary">Meu carrinho</Link>
          </div>
          <div className="space-y-3 text-sm">
            <p className="font-bold">Coleções</p>
            <p className="text-muted-foreground">Arte digital</p>
            <p className="text-muted-foreground">Colecionáveis</p>
            <p className="text-muted-foreground">Música</p>
          </div>
          <div className="space-y-3 text-sm">
            <p className="font-bold">Sobre a demonstração</p>
            <p className="leading-6 text-muted-foreground">Catálogo, API e carrinho simulados. Nenhuma transação real é realizada.</p>
          </div>
        </div>
        <p className="mx-auto max-w-[1200px] pt-6 text-xs text-muted-foreground">© 2026 KURIO. Projeto demonstrativo de frontend.</p>
      </footer>}

      {!isAuthPage && <nav aria-label="Navegação mobile" className="fixed inset-x-0 bottom-0 z-50 grid h-[calc(78px+env(safe-area-inset-bottom))] grid-cols-4 items-center rounded-t-[28px] border-t border-[#42291d] bg-[#241612]/95 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-2xl backdrop-blur lg:hidden">
        <Link to="/" search={defaultCatalogSearch} className={pathname === '/' ? 'flex justify-center text-primary' : 'flex justify-center text-[#cfb28c]'} aria-label="Início">
          <House size={23} fill={pathname === '/' ? 'currentColor' : 'none'} />
        </Link>
        <span aria-label="Favoritos em desenvolvimento" title="Favoritos em desenvolvimento" className="flex justify-center text-[#cfb28c]/55">
          <Heart size={23} />
        </span>
        <Link to="/cart" aria-label={`Carrinho: ${quantity} itens`} className={pathname === '/cart' ? 'relative flex justify-center text-primary' : 'relative flex justify-center text-[#cfb28c]'}>
          <ShoppingCart size={23}/>
          {quantity > 0 && <span className="absolute left-[55%] top-[-5px] h-4 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] text-primary-foreground">{quantity}</span>}
        </Link>
        {user ? (
          <Link to="/profile" aria-label="Meu perfil" title="Meu perfil" className="flex justify-center text-[#cfb28c] hover:text-primary">
            <UserRound size={23}/>
          </Link>
        ) : (
          <Link to="/login" search={{ next: pathname === '/cart' ? '/cart' : '/' }} aria-label="Entrar na conta" className="flex justify-center text-[#cfb28c]">
            <UserRound size={23}/>
          </Link>
        )}
      </nav>}
    </div>
  )
}
