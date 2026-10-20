import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useNfts } from '@/features/catalog/useNfts'
import { NftCard } from '@/components/catalog/NftCard'
import { FavoritesControlsProvider } from '@/components/catalog/FavoritesControlsProvider'
import { getNftArtwork } from '@/lib/nftArtwork'
import {
  useCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useCartSummary,
  getCartErrorMessage,
} from '@/features/cart/useCart'
import type { CartItem } from '@/features/cart/types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { multiplyEth } from '@/lib/eth'

const catalogSearch = {
  q: '',
  collection: 'all',
  available: false,
  sort: 'featured' as const,
  page: 1,
}

function QuantityControls({
  item, disabled, onUpdate,
}: {
  item: CartItem
  disabled: boolean
  onUpdate: (quantity: number) => void
}) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Quantidade de ${item.name}`}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-8 shrink-0 rounded-full border-[#624230] bg-[#331e14] p-0 text-primary hover:bg-primary hover:text-primary-foreground lg:size-7"
        aria-label={`Diminuir quantidade de ${item.name}`}
        disabled={disabled || item.quantity <= 1 || item.available < 1}
        onClick={() => onUpdate(item.quantity - 1)}
      >
        −
      </Button>
      <output aria-live="polite" className="min-w-6 text-center text-sm font-medium">
        {item.quantity}
      </output>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-8 shrink-0 rounded-full border-[#624230] bg-[#331e14] p-0 text-primary hover:bg-primary hover:text-primary-foreground lg:size-7"
        aria-label={`Aumentar quantidade de ${item.name}`}
        disabled={disabled || item.quantity >= item.available}
        onClick={() => onUpdate(item.quantity + 1)}
      >
        +
      </Button>
    </div>
  )
}

export function CartPage() {
  const { data, isPending, isError, refetch } = useCart()
  const related = useNfts(catalogSearch)
  const updateItem = useUpdateCartItem()
  const removeItem = useRemoveCartItem()
  const [notice, setNotice] = useState('')
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState('')
  const summary = useCartSummary(appliedCoupon)

  const isUpdating = updateItem.isPending || removeItem.isPending
  const mutationError = updateItem.error || removeItem.error
  const summaryReady = Boolean(summary.data && !summary.isFetching && !summary.isError)

  function updateQuantity(item: CartItem, quantity: number) {
    setNotice('')
    updateItem.mutate({ id: item.id, quantity }, {
      onSuccess: () => setNotice('Quantidade atualizada.'),
    })
  }

  function removeFromCart(item: CartItem) {
    setNotice('')
    removeItem.mutate(item.id, {
      onSuccess: () => setNotice('Item removido do carrinho.'),
    })
  }

  return (
    <main className="min-h-screen bg-background px-5 py-8 pb-24 md:px-6 md:py-10 md:pb-0">
      <div className="mx-auto max-w-[1200px] space-y-9">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              search={catalogSearch}
              aria-label="Voltar ao catálogo"
              className="flex size-9 items-center justify-center rounded-full border border-[#624230] bg-[#241612] text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
            >
              <ArrowLeft size={18} aria-hidden="true"/>
            </Link>
            <div>
              <p className="hidden text-xs text-[#cfb28c] lg:block">Início / Mercado / Carrinho</p>
              <h1 className="text-xl font-bold text-foreground lg:text-2xl">Carrinho de NFTs</h1>
            </div>
          </div>
          <Link
            to="/"
            search={catalogSearch}
            className="hidden text-sm text-primary underline underline-offset-4 hover:text-[#e89b55] lg:inline"
          >
            Continuar explorando
          </Link>
        </header>

        {isPending ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]" aria-label="Carregando carrinho">
            <div className="space-y-4">
              <Skeleton className="h-24 w-full"/>
              <Skeleton className="h-24 w-full"/>
            </div>
            <Skeleton className="h-72 w-full"/>
          </div>
        ) : isError ? (
          <div role="alert" className="space-y-4 rounded-xl border p-6">
            <p>Não foi possível carregar seu carrinho.</p>
            <Button onClick={() => void refetch()}>Tentar novamente</Button>
          </div>
        ) : (
          <>
            {mutationError && (
              <p role="alert" className="rounded-lg border border-destructive p-3 text-sm text-destructive">
                {getCartErrorMessage(mutationError)}
              </p>
            )}
            {notice && (
              <p role="status" className="rounded-lg border p-3 text-sm">{notice}</p>
            )}

            {data.items.length === 0 ? (
              <div className="rounded-xl border border-[#624230] p-10 text-center">
                <h2 className="text-xl font-semibold">Seu carrinho está vazio</h2>
                <p className="mt-2 text-muted-foreground">Explore o catálogo e escolha seus NFTs.</p>
                <Link
                  to="/"
                  search={catalogSearch}
                  className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  Explorar NFTs
                </Link>
              </div>
            ) : (
              <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_332px] lg:gap-12">
                <section aria-label="Itens do carrinho" className="min-w-0 space-y-4 lg:space-y-0">
                  <div aria-hidden="true" className="hidden grid-cols-[minmax(0,1.7fr)_105px_112px_110px_32px] gap-3 border-b border-[#624230] pb-3 text-xs font-medium lg:grid">
                    <span>NFTs</span>
                    <span>Preço</span>
                    <span>Edições</span>
                    <span>Total</span>
                    <span/>
                  </div>
                  {data.items.map(item => (
                    <article
                      key={item.id}
                      className="relative flex min-w-0 items-center gap-3 rounded-2xl bg-[#241612] p-3 lg:grid lg:min-h-[90px] lg:grid-cols-[minmax(0,1.7fr)_105px_112px_110px_32px] lg:gap-3 lg:rounded-none lg:border-b lg:border-[#39281d] lg:px-2 lg:py-3"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <img
                          src={getNftArtwork(item.nftId)}
                          alt={`Arte digital ${item.name}`}
                          className="size-[94px] shrink-0 rounded-xl object-cover lg:size-16 lg:rounded-md"
                          width={94}
                          height={94}
                        />
                        <div className="min-w-0 flex-1">
                          <h2 className="truncate text-sm font-semibold text-foreground" title={item.name}>{item.name}</h2>
                          <p className="mt-1 text-xs text-[#cfb28c]">Edição: {item.editionName}</p>
                          <p className="mt-2 font-semibold text-primary lg:hidden">
                            {multiplyEth(item.unitPriceEth, item.quantity)} ETH
                          </p>
                          <div className="mt-2 lg:hidden">
                            <QuantityControls item={item} disabled={isUpdating} onUpdate={quantity => updateQuantity(item, quantity)}/>
                          </div>
                        </div>
                      </div>

                      <p className="hidden text-sm text-primary lg:block">{item.unitPriceEth} ETH</p>
                      <div className="hidden lg:block">
                        <QuantityControls item={item} disabled={isUpdating} onUpdate={quantity => updateQuantity(item, quantity)}/>
                      </div>
                      <p className="hidden text-sm font-semibold text-primary lg:block">
                        {multiplyEth(item.unitPriceEth, item.quantity)} ETH
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 size-8 shrink-0 text-[#cfb28c] hover:text-primary lg:static"
                        aria-label={`Remover ${item.name} do carrinho`}
                        disabled={isUpdating}
                        onClick={() => removeFromCart(item)}
                      >
                        <Trash2 size={16} aria-hidden="true"/>
                      </Button>
                    </article>
                  ))}
                </section>

                <aside className="h-fit space-y-5 rounded-2xl border border-[#624230]/60 bg-[#241612] p-5 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0">
                  <h2 className="hidden border-b border-[#624230] pb-3 text-sm font-bold lg:block">Resumo da carteira</h2>
                  <div className="space-y-2">
                    <label htmlFor="cart-coupon" className="sr-only lg:not-sr-only lg:block lg:text-xs lg:font-semibold">
                      Código promocional
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="cart-coupon"
                        value={couponInput}
                        onChange={event => setCouponInput(event.target.value)}
                        placeholder="Digite o código promocional..."
                        className="h-11 min-w-0 flex-1 rounded-full border border-[#624230] bg-[#140d0a] px-3 text-xs outline-none placeholder:text-[#cfb28c] focus-visible:ring-2 focus-visible:ring-primary lg:h-9 lg:rounded-md"
                      />
                      <Button
                        type="button"
                        className="h-11 rounded-full px-4 text-xs font-semibold lg:h-9 lg:rounded-md"
                        onClick={() => setAppliedCoupon(couponInput.trim().toUpperCase())}
                      >
                        Aplicar
                      </Button>
                    </div>
                    {appliedCoupon && (
                      <button
                        type="button"
                        className="text-xs text-primary underline underline-offset-4"
                        onClick={() => { setAppliedCoupon(''); setCouponInput('') }}
                      >
                        Remover cupom {appliedCoupon}
                      </button>
                    )}
                  </div>
                  {summary.isFetching && (
                    <p role="status" className="text-xs text-[#cfb28c]">Atualizando valores na API simulada...</p>
                  )}
                  {summary.isError && (
                    <p role="alert" className="text-xs text-destructive">{getCartErrorMessage(summary.error)}</p>
                  )}
                  <dl className="space-y-3 text-xs sm:text-sm" aria-label="Valores estimados do pedido">
                    <div className="flex justify-between gap-4">
                      <dt>Subtotal</dt>
                      <dd>{summaryReady ? summary.data?.subtotalEth : '—'} ETH</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Desconto do lançamento</dt>
                      <dd>{summaryReady ? summary.data?.discountEth : '—'} ETH</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Taxa de rede</dt>
                      <dd>{summaryReady ? summary.data?.feeEth : '—'} ETH</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-[#624230] pt-4 text-base font-semibold">
                      <dt>Total</dt>
                      <dd className="text-primary">{summaryReady ? summary.data?.totalEth : '—'} ETH</dd>
                    </div>
                  </dl>
                  <Link
                    to="/checkout"
                    search={{ coupon: appliedCoupon }}
                    aria-disabled={!summaryReady}
                    onClick={event => { if (!summaryReady) event.preventDefault() }}
                    className={`flex h-12 w-full items-center justify-center rounded-full bg-primary px-4 text-center text-sm font-bold text-primary-foreground transition-colors hover:bg-[#e89b55] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:h-10 lg:rounded-md ${!summaryReady ? 'pointer-events-none opacity-60' : ''}`}
                  >
                    Conectar e finalizar
                  </Link>
                  <p className="text-center text-xs text-[#cfb28c]">
                    Simulação: nenhum pagamento ou transferência de NFT real ocorre.
                  </p>
                  <Link
                    to="/"
                    search={catalogSearch}
                    className="block text-center text-xs font-semibold text-primary hover:underline lg:mt-2"
                  >
                    Continuar explorando
                  </Link>
                </aside>
              </div>
            )}
          </>
        )}

        {related.data && (
          <section aria-label="Colecionadores também viram" className="border-t border-[#624230] pt-8">
            <h2 className="mb-7 font-semibold text-primary">Colecionadores também viram</h2>
            <FavoritesControlsProvider>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {related.data.items.slice(0, 5).map(item => (
                  <NftCard key={item.id} nft={item} compact/>
                ))}
              </div>
            </FavoritesControlsProvider>
          </section>
        )}
      </div>
    </main>
  )
}
