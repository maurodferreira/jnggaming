import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { useCart } from '@/features/cart/useCart'
import { useProfile, useWallets } from '@/features/account/useAccount'
import { getAuthErrorMessage } from '@/features/auth/useAuth'
import { useCreateOrder, useQuote } from '@/features/checkout/useCheckout'
import type { OrderInput, OrderResponse, QuoteResponse } from '@/features/checkout/types'
import { api } from '@/services/api'
import { getNftArtwork } from '@/lib/nftArtwork'
import { Skeleton } from '@/components/ui/skeleton'
import { AccountField } from '@/components/account/AccountField'

const providers: OrderInput['provider'][] = [
  'WalletConnect', 'MetaMask', 'Coinbase Wallet',
]

function formatWalletAddress(address: string): string {
  if (address.length <= 18) return address
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export function CheckoutPage() {
  const { coupon: initialCoupon } = useSearch({ from: '/checkout' })
  const cart = useCart()
  const profile = useProfile()
  const wallets = useWallets()
  const navigate = useNavigate()
  const [selectedWalletId, setSelectedWalletId] = useState('')
  const [provider, setProvider] = useState<OrderInput['provider']>('Coinbase Wallet')
  const [couponInput, setCouponInput] = useState(initialCoupon)
  const [coupon, setCoupon] = useState(initialCoupon)
  const [notes, setNotes] = useState('')
  const [attemptKey, setAttemptKey] = useState(() => crypto.randomUUID())
  const [recoveryMessage, setRecoveryMessage] = useState('')

  const wallet = wallets.data?.find(item => item.id === selectedWalletId) ?? wallets.data?.[0]
  const network: QuoteResponse['network'] = wallet?.network ?? 'Ethereum'
  const quote = useQuote(coupon, network)
  const submitOrder = useCreateOrder()

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!wallet || !quote.data || !profile.data || !cart.data?.items.length) return
    setRecoveryMessage('')
    if (quote.data.expiresAt <= Date.now()) {
      setRecoveryMessage('A cotação expirou. Confira os valores atualizados antes de continuar.')
      await quote.refetch()
      return
    }
    try {
      const order = await submitOrder.mutateAsync({
        idempotencyKey: attemptKey,
        quoteId: quote.data.id,
        walletId: wallet.id,
        provider,
        notes: notes.trim() || undefined,
      })
      await navigate({
        to: '/orders/$orderId',
        params: { orderId: order.id },
      })
    } catch (error) {
      // A broken response does not prove the payment failed. Fetch this exact
      // idempotency key before allowing the collector to submit another order.
      if (axios.isAxiosError(error) && !error.response) {
        setRecoveryMessage('A conexão falhou. Verificando se o pedido já foi registrado...')
        try {
          const { data } = await api.get<OrderResponse>(
            `/orders/${encodeURIComponent(attemptKey)}`,
          )
          await navigate({ to: '/orders/$orderId', params: { orderId: data.id } })
          return
        } catch {
          setRecoveryMessage('Não foi possível confirmar o estado do pedido. Tente novamente com a mesma chave de operação.')
        }
      }
      // API validation failures stay on checkout; no fake receipt is shown.
    }
  }

  const disabled = submitOrder.isPending || !wallet || !quote.data || quote.isFetching || !profile.data || !cart.data?.items.length

  return (
    <main className="mx-auto min-h-[65vh] max-w-[1248px] px-5 pb-48 pt-6 text-foreground md:px-6 md:pb-12">
      <div className="mb-7 flex items-center gap-4 lg:mb-8 lg:block">
        <Link to="/cart" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[#624230] bg-[#241612] text-primary hover:border-primary focus-visible:outline-2 focus-visible:outline-primary lg:mb-6 lg:h-auto lg:w-auto lg:justify-start lg:gap-2 lg:rounded-none lg:border-0 lg:bg-transparent lg:text-sm lg:text-[#cfb28c]">
          <ArrowLeft size={18} aria-hidden="true"/>
          <span className="sr-only lg:not-sr-only">Voltar ao carrinho</span>
        </Link>
        <h1 className="min-w-0 text-lg font-bold leading-tight sm:text-xl">Pagamento com carteira</h1>
      </div>
      <div className="grid gap-6 md:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,390px)] lg:gap-12">
        <div className="min-w-0 space-y-6 lg:space-y-8">
          <section className="hidden space-y-4 lg:block" aria-label="Dados do colecionador">
            <h2 className="text-base font-bold">Perfil do colecionador</h2>
            {profile.isPending ? <Skeleton className="h-24 w-full"/> : profile.isError ? (
              <p role="alert" className="text-sm text-destructive">Não foi possível carregar seus dados.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <AccountField id="checkout-display" label="Nome de exibição" value={profile.data?.displayName ?? ''} readOnly/>
                <AccountField id="checkout-user" label="Nome de usuário" value={profile.data?.username ?? ''} readOnly/>
                <AccountField id="checkout-network" label="Rede" value={network} readOnly/>
                <AccountField id="checkout-profile-name" label="Nome do perfil" value={profile.data?.displayName ?? ''} readOnly/>
                <AccountField id="checkout-address" label="Endereço da carteira"
                  value={wallet?.address ?? ''} placeholder="Selecione uma carteira cadastrada" readOnly/>
                <AccountField id="checkout-ens-secondary" label="ENS ou carteira secundária (opcional)"
                  value={profile.data?.ensName ?? ''} placeholder="Não configurado" readOnly/>
                <AccountField id="checkout-wallet-type" label="Tipo de carteira"
                  value={wallet?.type ?? ''} placeholder="Selecione uma carteira cadastrada" readOnly/>
                <AccountField id="checkout-referral" label="Código de indicação"
                  disabled placeholder="Indicações fora do escopo da demonstração"/>
                <AccountField id="checkout-email" label="E-mail" type="email" value={profile.data?.email ?? ''} readOnly/>
                <AccountField id="checkout-ens" label="Nome ENS" value={profile.data?.ensName ?? ''} placeholder="Não configurado" readOnly/>
              </div>
            )}
            <p className="text-xs text-[#cfb28c]">Precisa alterar seus dados? <Link to="/profile" className="text-primary underline-offset-4 hover:underline">Editar perfil</Link></p>
          </section>

          <section className="space-y-4" aria-label="Escolha da carteira">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-bold sm:text-base"><span className="lg:hidden">Carteira conectada</span><span className="hidden lg:inline">Carteira e rede</span></h2>
              <Link to="/wallets" className="text-xs text-primary hover:underline"><span className="lg:hidden">Trocar carteira</span><span className="hidden lg:inline">Gerenciar carteiras</span></Link>
            </div>
            {wallets.isPending ? <Skeleton className="h-40 w-full"/> : wallets.isError ? (
              <p role="alert" className="text-sm text-destructive">Falha ao consultar carteiras.</p>
            ) : !wallets.data?.length ? (
              <div className="space-y-4 rounded-xl border border-[#624230] bg-[#241612] p-5">
                <p className="text-sm text-[#cfb28c]">Você precisa cadastrar uma carteira fictícia antes de continuar o pagamento simulado.</p>
                <Link to="/wallets" className="inline-flex rounded-md bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Cadastrar carteira</Link>
              </div>
            ) : (
              <fieldset className="space-y-3">
                <legend className="sr-only">Selecione a carteira para esta compra</legend>
                {wallets.data.map(item => (
                  <label key={item.id} className={`flex min-h-[90px] cursor-pointer items-start gap-3 rounded-[15px] border bg-[#241612] p-4 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30 ${wallet?.id === item.id ? 'border-primary' : 'border-[#624230]/60 hover:border-primary/70'}`}>
                    <input type="radio" name="wallet" checked={wallet?.id === item.id} onChange={() => {
                      setSelectedWalletId(item.id)
                      setAttemptKey(crypto.randomUUID())
                    }} className="mt-1 accent-primary"/>
                    <span className="min-w-0 space-y-1">
                      <span className="block font-semibold">{item.label}</span>
                      <span className="block text-xs text-[#cfb28c]">{item.nickname} · {item.network}</span>
                      <span className="block truncate text-xs text-[#cfb28c]" title={item.address}>{formatWalletAddress(item.address)}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
            )}
          </section>
          <div className="hidden space-y-3 lg:block">
            <label htmlFor="collector-notes" className="block text-sm font-semibold">Observação do colecionador (opcional)</label>
            <textarea id="collector-notes" maxLength={300} rows={4} value={notes} onChange={event => {
              setNotes(event.target.value)
              setAttemptKey(crypto.randomUUID())
            }} className="w-full resize-y rounded-md border border-[#624230] bg-[#241612] p-3 text-sm outline-none focus-visible:border-primary"/>
          </div>
        </div>

        <form onSubmit={confirm} className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-5 lg:self-start">
          <section className="hidden space-y-4 lg:order-1 lg:block">
            <h2 className="border-b border-[#624230] pb-3 text-sm font-bold">Seus NFTs</h2>
            {cart.isPending ? <Skeleton className="h-40 w-full"/> : (
              <div className="space-y-2">
                {cart.data?.items.map(item => (
                  <div key={item.id} className="flex items-center gap-3 rounded-md bg-[#241612] p-2">
                    <img src={getNftArtwork(item.nftId)} alt="" className="size-14 rounded-md object-cover"/>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{item.name}</p>
                      <p className="text-xs text-[#cfb28c]">Edição: {item.editionName} × {item.quantity}</p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-primary">{item.unitPriceEth} ETH</p>
                  </div>
                ))}
                {!cart.data?.items.length && <p className="text-sm text-muted-foreground">Seu carrinho está vazio.</p>}
              </div>
            )}
          </section>
          <section className="order-2 space-y-3" aria-label="Cupom e resumo">
            <label htmlFor="promo-code" className="block text-xs font-medium text-[#cfb28c]">Código promocional</label>
            <div className="flex gap-2">
              <input id="promo-code" value={couponInput} onChange={e => setCouponInput(e.target.value)}
                placeholder="Digite seu cupom" className="min-w-0 flex-1 rounded-md border border-[#624230] bg-transparent p-3 text-xs outline-none focus-visible:border-primary"/>
              <button type="button" onClick={() => {
                setCoupon(couponInput.trim().toUpperCase())
                setAttemptKey(crypto.randomUUID())
              }} className="rounded-md bg-primary px-4 text-xs font-bold text-primary-foreground">Aplicar</button>
              {coupon && <button type="button" onClick={() => {
                setCoupon('');setCouponInput('');setAttemptKey(crypto.randomUUID())
              }} className="text-xs text-primary" aria-label="Remover cupom">Remover</button>}
            </div>
            {quote.isError && <p role="alert" className="text-xs text-destructive">{getAuthErrorMessage(quote.error)}</p>}
            {quote.isFetching && <p role="status" className="text-xs text-[#cfb28c]">Atualizando cotação...</p>}
            <dl className="space-y-3 border-b border-[#624230] pb-5 text-xs">
              <div className="flex justify-between gap-3"><dt>Subtotal</dt><dd>{quote.data?.subtotalEth ?? '—'} ETH</dd></div>
              <div className="flex justify-between gap-3"><dt>Desconto</dt><dd>{quote.data?.discountEth ?? '—'} ETH</dd></div>
              <div className="flex justify-between gap-3"><dt>Taxa de rede estimada</dt><dd>{quote.data?.feeEth ?? '—'} ETH</dd></div>
              <div className="flex justify-between gap-3 text-sm font-bold text-primary"><dt>Total</dt><dd>{quote.data?.totalEth ?? '—'} ETH</dd></div>
            </dl>
            <p className="flex items-start gap-2 text-xs text-[#cfb28c]"><ShieldCheck size={17} className="shrink-0"/> A cotação será validada pela API simulada antes do pedido. Nenhuma transação real ocorre.</p>
          </section>
          <fieldset className="order-1 space-y-4 lg:order-3">
            <legend className="mb-4 text-sm font-bold">Carteira e rede · Provedor simulado</legend>
            {providers.map(p => (
              <label key={p} className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-[15px] border bg-[#241612] px-4 py-3 text-sm transition-colors hover:border-primary focus-within:ring-2 focus-within:ring-primary/30 ${provider === p ? 'border-primary' : 'border-[#624230]/60'}`}>
                <input type="radio" name="provider" checked={provider === p} onChange={() => {
                  setProvider(p)
                  setAttemptKey(crypto.randomUUID())
                }} className="accent-primary"/>
                {p}
              </label>
            ))}
          </fieldset>
          {recoveryMessage && <p role="status" className="order-3 rounded-md border border-[#624230] p-3 text-xs text-[#e89b55]">{recoveryMessage}</p>}
          {submitOrder.isError && (
            <div role="alert" className="order-3 space-y-2 text-xs text-destructive">
              <p>{getAuthErrorMessage(submitOrder.error)}</p>
              <button type="button" onClick={() => void quote.refetch()} className="text-primary underline">Atualizar cotação</button>
            </div>
          )}
          <button type="submit" disabled={disabled} className="order-4 mt-2 h-[54px] w-full rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-[#e89b55] focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50 lg:static">
            {submitOrder.isPending ? 'Enviando pedido...' : 'Confirmar compra simulada'}
          </button>
        </form>
      </div>
    </main>
  )
}
