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

      {!isAuthPage && (
        <footer className="mt-20 hidden bg-[#241612] text-foreground lg:block">
          {/* Information cards reproduce the Figma composition without adding
              fake newsletter subscriptions or pages outside the brief. */}
          <div className="mx-auto grid max-w-[1248px] grid-cols-4 gap-0 px-6 py-10">
            {[
              { initial: 'S', title: 'Segurança da carteira', description: 'Aprenda a proteger seu acesso e seus ativos digitais.' },
              { initial: 'C', title: 'Criadores em destaque', description: 'Descubra artistas e comunidades que movimentam a arte digital.' },
              { initial: 'D', title: 'Novidades do mercado', description: 'Explore coleções, lançamentos e tendências da cultura digital.' },
            ].map(item => (
              <div key={item.initial} className="space-y-3 border-r border-[#8c542d] px-5 first:pl-0">
                <div aria-hidden="true" className="grid size-14 place-items-center rounded-full bg-primary text-lg font-bold text-primary-foreground">{item.initial}</div>
                <p className="text-sm font-bold">{item.title}</p>
                <p className="max-w-[215px] text-xs leading-6 text-[#cfb28c]">{item.description}</p>
              </div>
            ))}
            <div className="space-y-3 pl-5">
              <p className="text-sm font-bold">Explore o próximo lançamento</p>
              <p className="text-xs leading-6 text-[#cfb28c]">
                Encontre NFTs e coleções no catálogo demonstrativo da KURIO.
              </p>
              <Link to="/" hash="market" search={defaultCatalogSearch} className="inline-flex min-h-10 items-center rounded-md bg-primary px-5 text-xs font-bold text-primary-foreground hover:bg-[#e89b55] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                Explorar NFTs
              </Link>
            </div>
          </div>

          <div className="bg-[#422613] px-6 py-6">
            <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 text-xs">
              <p className="font-bold tracking-[0.18em]">KURIO</p>
              <p className="text-[#f2d3b2]">Feito para colecionadores, criadores e cultura digital.</p>
              <p className="text-[#f2d3b2]">Marketplace demonstrativo de NFTs</p>
            </div>
          </div>

          <div className="mx-auto grid max-w-[1248px] grid-cols-4 gap-10 px-6 py-10 text-sm">
            <div className="space-y-4">
              <h2 className="font-bold">Meu perfil</h2>
              <Link to="/profile" className="block text-[#cfb28c] hover:text-primary">Dados da conta</Link>
              <Link to="/wallets" className="block text-[#cfb28c] hover:text-primary">Carteiras</Link>
              <Link to="/cart" className="block text-[#cfb28c] hover:text-primary">Meu carrinho</Link>
            </div>
            <div className="space-y-4">
              <h2 className="font-bold">Explorar</h2>
              <Link to="/" hash="market" search={defaultCatalogSearch} className="block text-[#cfb28c] hover:text-primary">Mercado de NFTs</Link>
              <Link to="/" search={defaultCatalogSearch} className="block text-[#cfb28c] hover:text-primary">Início</Link>
              <p className="text-xs leading-5 text-[#cfb28c]">O catálogo e os pedidos utilizam APIs simuladas.</p>
            </div>
            <div className="space-y-4">
              <h2 className="font-bold">Coleções</h2>
              <p className="text-[#cfb28c]">Arte digital</p>
              <p className="text-[#cfb28c]">Fotografia</p>
              <p className="text-[#cfb28c]">Música</p>
              <p className="text-[#cfb28c]">Arte 3D</p>
            </div>
            <div className="space-y-4">
              <h2 className="font-bold">Carteiras e redes</h2>
              <p className="text-xs leading-6 text-[#cfb28c]">
                Ethereum, Polygon e Solana fazem parte da simulação. Não conecte carteiras reais.
              </p>
              <p className="text-xs leading-6 text-[#cfb28c]">Provedores simulados: MetaMask, WalletConnect e Coinbase Wallet.</p>
            </div>
          </div>
          <p className="border-t border-[#624230] px-6 py-5 text-center text-xs text-[#cfb28c]">
            © 2026 KURIO. Projeto demonstrativo · Nenhuma transação real é realizada.
          </p>
        </footer>
      )}

      {!isAuthPage && <nav aria-label="Navegação mobile" className="fixed inset-x-0 bottom-0 z-50 grid h-[calc(78px+env(safe-area-inset-bottom))] grid-cols-4 items-center rounded-t-[28px] border-t border-[#42291d] bg-[#241612]/95 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-2xl backdrop-blur lg:hidden">
        <Link to="/" search={defaultCatalogSearch} className={pathname === '/' ? 'flex justify-center text-primary' : 'flex justify-center text-[#cfb28c]'} aria-label="Início">
          <House size={23} fill={pathname === '/' ? 'currentColor' : 'none'} />
        </Link>
        <span aria-hidden="true" title="Favoritos em desenvolvimento" className="flex justify-center text-[#cfb28c]/55">
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
