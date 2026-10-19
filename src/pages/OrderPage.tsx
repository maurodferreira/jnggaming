import { useEffect } from 'react'
import { Link, getRouteApi } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Clock3, ShieldAlert, XCircle } from 'lucide-react'
import { useOrder } from '@/features/checkout/useCheckout'
import { getNftArtwork } from '@/lib/nftArtwork'
import { Skeleton } from '@/components/ui/skeleton'

const routeApi = getRouteApi('/orders/$orderId')
const catalogSearch = {
  q: '', collection: 'all', available: false, sort: 'featured' as const, page: 1,
}

export function OrderPage() {
  const { orderId } = routeApi.useParams()
  const order = useOrder(orderId)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (order.data?.status === 'confirmed') {
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
    }
  }, [order.data?.status, queryClient])

  if (order.isPending) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-5 py-12" aria-label="Carregando pedido">
        <Skeleton className="h-[420px] w-full rounded-xl"/>
      </main>
    )
  }

  if (order.isError || !order.data) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-5 px-5 text-center">
        <ShieldAlert size={38} className="text-primary"/>
        <h1 className="text-lg font-bold">Não foi possível consultar este pedido</h1>
        <p role="alert" className="text-sm text-[#cfb28c]">Se houve interrupção, o pedido pode continuar pendente na simulação. Tente consultar novamente; não inicie outra compra automaticamente.</p>
        <button type="button" onClick={() => void order.refetch()} className="rounded-md bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">Consultar novamente</button>
        <Link to="/cart" className="text-sm text-primary hover:underline">Voltar ao carrinho</Link>
      </main>
    )
  }

  const data = order.data
  const confirmed = data.status === 'confirmed'
  const pending = data.status === 'pending'
  return (
    <main className="mx-auto flex min-h-[75vh] max-w-[620px] items-center justify-center px-5 pb-24 pt-12 md:pb-16">
      <section className="w-full overflow-hidden rounded-xl border border-[#624230] bg-[#241612] text-foreground" aria-labelledby="order-title">
        <div className="space-y-4 p-6 text-center md:p-9">
          <div className="flex justify-center text-primary" aria-hidden="true">
            {confirmed ? <CheckCircle2 size={52}/> : pending ? <Clock3 size={52}/> : <XCircle size={52}/>}
          </div>
          <h1 id="order-title" className="text-lg font-bold">
            {confirmed
              ? 'Pedido confirmado na demonstração!'
              : pending
                ? 'Pedido recebido. Aguardando resultado...'
                : 'Pedido recusado na simulação'}
          </h1>
          <p className="text-xs leading-6 text-[#cfb28c]">
            {confirmed
              ? 'Este recibo é um registro simulado. Nenhum NFT foi transferido e nenhuma transação blockchain ocorreu.'
              : pending
                ? 'Consultaremos o estado deste mesmo pedido, sem criar compras duplicadas.'
                : data.errorMessage ?? 'Nenhum valor real foi movimentado. Seus itens permanecem no carrinho.'}
          </p>
          {pending && <p role="status" aria-live="polite" className="text-sm text-primary">Consultando resultado do pagamento simulado...</p>}
        </div>

        <dl className="grid grid-cols-2 gap-4 border-y border-[#624230] bg-[#382117] p-5 text-xs sm:grid-cols-4">
          <div className="min-w-0 space-y-1"><dt className="text-[#cfb28c]">ID simulado</dt><dd className="truncate font-semibold" title={data.transactionId}>{data.transactionId.slice(0,12)}…</dd></div>
          <div className="space-y-1"><dt className="text-[#cfb28c]">Data</dt><dd>{new Date(data.createdAt).toLocaleDateString('pt-BR')}</dd></div>
          <div className="space-y-1"><dt className="text-[#cfb28c]">Total</dt><dd className="font-bold text-primary">{data.quote.totalEth} ETH</dd></div>
          <div className="space-y-1"><dt className="text-[#cfb28c]">Carteira</dt><dd className="truncate" title={data.walletNickname}>{data.walletNickname}</dd></div>
        </dl>

        <div className="space-y-5 p-5 md:p-8">
          <h2 className="text-sm font-bold">Detalhes da transação simulada</h2>
          <div className="space-y-3">
            {data.quote.items.map(item => (
              <div key={item.id} className="flex items-center gap-3 border-b border-[#624230]/40 pb-3">
                <img src={getNftArtwork(item.nftId)} className="size-14 shrink-0 rounded-md object-cover" alt=""/>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{item.name}</p>
                  <p className="text-xs text-[#cfb28c]">{item.editionName} × {item.quantity}</p>
                </div>
                <span className="shrink-0 text-xs font-bold text-primary">{item.unitPriceEth} ETH/un.</span>
              </div>
            ))}
          </div>
          <dl className="space-y-2 border-b border-[#624230] pb-5 text-xs">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{data.quote.subtotalEth} ETH</dd></div>
            <div className="flex justify-between"><dt>Desconto</dt><dd>{data.quote.discountEth} ETH</dd></div>
            <div className="flex justify-between"><dt>Taxa de rede</dt><dd>{data.quote.feeEth} ETH</dd></div>
            <div className="flex justify-between text-sm font-bold"><dt>Total</dt><dd className="text-primary">{data.quote.totalEth} ETH</dd></div>
          </dl>
          <p className="text-center text-xs leading-6 text-muted-foreground">
            Rede: {data.quote.network} · Provedor: {data.provider} · Status: {data.status}
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/" search={catalogSearch} className="rounded-md bg-primary px-6 py-3 text-center text-xs font-bold text-primary-foreground hover:bg-[#e89b55]">Continuar explorando</Link>
            {!confirmed && <Link to="/cart" className="rounded-md border border-[#624230] px-6 py-3 text-center text-xs hover:border-primary">Voltar ao carrinho</Link>}
          </div>
        </div>
      </section>
    </main>
  )
}
