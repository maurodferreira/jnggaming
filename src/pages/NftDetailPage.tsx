import { useState } from 'react'
import axios from 'axios'
import { Link, getRouteApi } from '@tanstack/react-router'

import { useNft } from '@/features/catalog/useNft'
import { useNfts } from '@/features/catalog/useNfts'
import { NftCard } from '@/components/catalog/NftCard'
import { NftArtworkGallery } from '@/components/catalog/NftArtworkGallery'
import { NftDetailsTabs } from '@/components/catalog/NftDetailsTabs'
import { FavoriteButton } from '@/components/catalog/FavoriteButton'
import type { NftDetail } from '@/features/catalog/types'
import { multiplyEth } from '@/lib/eth'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import {
  useAddToCart,
  getCartErrorMessage,
} from '@/features/cart/useCart'

const routeApi = getRouteApi('/nft/$nftId')

const catalogSearch = {
  q: '',
  collection: 'all',
  available: false,
  sort: 'featured' as const,
  page: 1,
}

// Seleção de edição e quantidade
function EditionSelector({ nft }: { nft: NftDetail }) {
  const firstAvailable = nft.editions.find(
    (edition) => edition.available > 0
  )

  const [editionId, setEditionId] = useState(
    firstAvailable?.id ?? nft.editions[0]?.id ?? ''
  )

  const [quantity, setQuantity] = useState(1)

  const addToCart = useAddToCart()

  const selectedEdition = nft.editions.find(
    (edition) => edition.id === editionId
  )

  if (!selectedEdition) {
    return (
      <p role="alert" className="text-muted-foreground">
        Nenhuma edição cadastrada.
      </p>
    )
  }

  const available = selectedEdition.available

  const selectedQuantity =
    available > 0 ? Math.min(quantity, available) : 0

  const total = multiplyEth(
    selectedEdition.priceEth,
    selectedQuantity
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Escolha da edição */}
      <fieldset className="space-y-2 sm:space-y-3">
        <legend className="font-medium">
          Escolha uma edição
        </legend>

        <div className="flex flex-wrap gap-2 sm:grid sm:grid-cols-2 sm:gap-3">
          {nft.editions.map((edition) => (
            <label
              key={edition.id}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors focus-within:ring-2 focus-within:ring-primary sm:flex sm:items-start sm:gap-3 sm:rounded-xl sm:p-4 ${
                editionId === edition.id
                  ? 'border-primary bg-muted/50'
                  : 'hover:bg-muted/30'
              }`}
            >
              <input
                type="radio"
                name={`edition-${nft.id}`}
                value={edition.id}
                checked={editionId === edition.id}
                onChange={() => {
                  setEditionId(edition.id)
                  setQuantity(1)
                  addToCart.reset()
                }}
                className="sr-only sm:not-sr-only sm:mt-1 sm:accent-primary"
              />

              <span className="space-y-1">
                <span className="block font-medium">
                  {edition.name}
                </span>

                <span className="hidden text-sm sm:block">
                  {edition.priceEth} ETH
                </span>

                <span className="hidden text-xs text-muted-foreground sm:block">
                  {edition.available > 0
                    ? `${edition.available} disponíveis`
                    : 'Esgotada'}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Controle de quantidade */}
      <div className="space-y-2 sm:space-y-3">
        <p className="font-medium">Quantidade</p>

        <div className="flex items-center gap-3 sm:gap-4">
          <Button
            type="button"
            variant="outline"
            aria-label="Diminuir quantidade"
            disabled={selectedQuantity <= 1}
            onClick={() =>
              setQuantity((current) =>
                Math.max(1, current - 1)
              )
            }
          >
            −
          </Button>

          <output
            aria-live="polite"
            className="min-w-8 text-center font-medium"
          >
            {selectedQuantity}
          </output>

          <Button
            type="button"
            variant="outline"
            aria-label="Aumentar quantidade"
            disabled={selectedQuantity >= available}
            onClick={() =>
              setQuantity((current) =>
                Math.min(available, current + 1)
              )
            }
          >
            +
          </Button>
          <p className="ml-auto text-lg font-bold text-primary sm:hidden" aria-label={`Subtotal: ${total} ETH`}>
            {total} ETH
          </p>
        </div>

        <p className="hidden text-sm text-muted-foreground sm:block">
          {available > 0
            ? `Limite de ${available} unidades nesta edição.`
            : 'Esta edição não está disponível.'}
        </p>
      </div>

      {/* Resumo dos valores */}
      <div className="hidden rounded-xl border p-5 sm:block">
        <p className="text-sm text-muted-foreground">
          Preço unitário
        </p>

        <p className="mt-1 font-medium">
          {selectedEdition.priceEth} ETH
        </p>

        <div className="my-4 border-t" />

        <p className="text-sm text-muted-foreground">
          Subtotal estimado
        </p>

        <p
          className="mt-1 text-2xl font-semibold"
          aria-live="polite"
        >
          {total} ETH
        </p>

        <p className="mt-2 text-xs text-muted-foreground">
          Taxas e descontos serão calculados no checkout.
        </p>
      </div>

      {/* Adicionar ao carrinho */}
      <div className="space-y-3">
        <Button
          type="button"
          className="w-full"
          disabled={
            selectedQuantity === 0 ||
            addToCart.isPending
          }
          onClick={() => {
            addToCart.mutate({
              nftId: nft.id,
              editionId: selectedEdition.id,
              quantity: selectedQuantity,
            })
          }}
        >
          {addToCart.isPending
            ? 'Adicionando...'
            : 'Adicionar ao carrinho'}
        </Button>

        {/* Mensagem de erro */}
        {addToCart.isError && (
          <p
            role="alert"
            className="text-sm text-destructive"
          >
            {getCartErrorMessage(addToCart.error)}
          </p>
        )}

        {/* Confirmação de sucesso */}
        {addToCart.isSuccess && (
          <div
            role="status"
            className="rounded-lg border p-4 text-sm"
          >
            <p className="font-medium">
              NFT adicionado ao carrinho!
            </p>

            <Link
              to="/cart"
              className="mt-2 inline-block font-medium underline underline-offset-4"
            >
              Ver meu carrinho →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// Página de detalhes
export function NftDetailPage() {
  const { nftId } = routeApi.useParams()

  const {
    data: nft,
    isPending,
    error,
    refetch,
  } = useNft(nftId)

  // The primary NFT is needed above the fold. Fetch suggestions only after it resolves.
  const related = useNfts(catalogSearch, { enabled: Boolean(nft) })
  const [shareNotice, setShareNotice] = useState('')

  async function copyNftLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShareNotice('Link copiado para compartilhar.')
    } catch {
      setShareNotice('Não foi possível copiar o link neste navegador.')
    }
  }

  // Carregamento
  if (isPending) {
    // Match the resolved page geometry to avoid shifting the whole main column
    // when the mock REST response arrives, especially on direct deep links.
    return (
      <main aria-label="Carregando NFT" className="mx-auto max-w-[1248px] space-y-5 px-5 pb-24 pt-5 sm:space-y-8 sm:py-8 md:px-6 md:pb-0">
        <Skeleton className="h-10 w-40 rounded-full sm:h-5" />
        <section className="grid gap-0 sm:gap-10 lg:grid-cols-2">
          <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-[76px_minmax(0,1fr)]">
            <div className="hidden flex-col gap-3 sm:flex" aria-hidden="true">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton className="aspect-square w-full rounded-md" key={index} />
              ))}
            </div>
            <Skeleton className="aspect-square w-full rounded-[24px] sm:rounded-lg" />
          </div>
          <div className="relative -mx-5 -mt-6 space-y-6 rounded-t-[28px] bg-[#241612] px-5 pb-7 pt-8 sm:mx-0 sm:mt-0 sm:rounded-none sm:bg-transparent sm:p-0 lg:min-h-[950px]">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-16 w-full" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </section>
        {/* Reserve the full details/metadata area while the primary NFT loads.
            This prevents the related collection and footer from jumping on desktop. */}
        <Skeleton className="h-[380px] w-full sm:h-[360px]" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton className="aspect-square w-full rounded-lg" key={index} />
          ))}
        </div>
      </main>
    )
  }

  // Erro ou NFT inexistente
  if (error) {
    const notFound =
      axios.isAxiosError(error) &&
      error.response?.status === 404

    return (
      <main className="mx-auto max-w-5xl space-y-4 p-6">
        <h1 className="text-2xl font-bold">
          {notFound
            ? 'NFT não encontrado'
            : 'Não foi possível carregar o NFT'}
        </h1>

        <p className="text-muted-foreground">
          {notFound
            ? 'Esse NFT não existe no catálogo.'
            : 'Ocorreu um problema ao buscar os detalhes.'}
        </p>

        {!notFound && (
          <Button onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        )}

        <Link
          to="/"
          search={catalogSearch}
          className="block underline"
        >
          Voltar ao catálogo
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-[1248px] space-y-5 px-5 pb-24 pt-5 sm:space-y-8 sm:py-8 md:px-6 md:pb-0">
      <Link
        to="/"
        search={catalogSearch}
        className="inline-flex size-10 items-center justify-center rounded-full border border-[#624230] bg-[#241612] text-lg text-primary hover:border-primary focus-visible:outline-2 focus-visible:outline-primary sm:h-auto sm:w-auto sm:justify-start sm:rounded-none sm:border-0 sm:bg-transparent sm:text-sm sm:text-muted-foreground sm:hover:underline"
      >
        <span aria-hidden="true">←</span><span className="sr-only sm:not-sr-only sm:ml-2">Voltar ao catálogo</span>
      </Link>

      <section className="grid gap-0 sm:gap-10 lg:grid-cols-2">
        <div className="relative">
          <NftArtworkGallery key={nft.id} nftId={nft.id} nftName={nft.name} />
          <div className="absolute right-4 top-16 z-10 sm:hidden">
            <FavoriteButton nftId={nft.id} />
          </div>
        </div>

        {/* Informações */}
        <div className="relative -mx-5 -mt-6 space-y-4 rounded-t-[28px] bg-[#241612] px-5 pb-7 pt-6 shadow-[0_-12px_32px_rgba(0,0,0,0.22)] sm:mx-0 sm:mt-0 sm:rounded-none sm:bg-transparent sm:p-0 sm:shadow-none">
          <div>
            <p className="hidden text-muted-foreground sm:block">
              {nft.collection}
            </p>

            <div className="mt-2 flex items-center justify-between gap-4">
              <h1 className="text-xl font-bold sm:text-3xl">{nft.name}</h1>
              <div className="hidden sm:block"><FavoriteButton nftId={nft.id} /></div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 border-b border-[#624230] pb-3">
              <strong className="text-lg text-primary">{nft.priceEth} ETH</strong>
              {nft.metadata.reviewSummary && (
                <span className="text-xs text-[#cfb28c]">
                  <span className="text-primary" aria-hidden="true">★</span>{' '}
                  {nft.metadata.reviewSummary.average.toFixed(1)} · {nft.metadata.reviewSummary.count} avaliações ilustrativas
                </span>
              )}
            </div>
            <p className="mt-3 text-sm leading-6 text-[#cfb28c] sm:mt-4 sm:leading-7">
              <span className="font-semibold text-foreground">Sobre este NFT: </span>
              {nft.metadata.description}
            </p>
          </div>

          <EditionSelector key={nft.id} nft={nft} />

          <section aria-label="Metadados demonstrativos">
            <dl className="space-y-1 text-xs leading-6 text-[#cfb28c]">
            <div className="flex flex-wrap gap-2">
              <dt>ID do token:</dt>
              <dd>{nft.metadata.tokenId}</dd>
            </div>
            <div className="flex flex-wrap gap-2">
              <dt>Coleção:</dt>
              <dd>{nft.metadata.collectionLabel}</dd>
            </div>
            <div className="flex flex-wrap gap-2">
              <dt>Atributos:</dt>
              <dd>{nft.metadata.attributes.length > 0
                ? nft.metadata.attributes.join(', ')
                : 'Não informados nesta demonstração'}</dd>
            </div>
            </dl>
          </section>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span>Compartilhar este NFT:</span>
            <button
              type="button"
              onClick={() => void copyNftLink()}
              className="rounded-md border border-[#624230] px-3 py-1.5 text-primary hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Copiar link
            </button>
            {shareNotice && <span role="status" className="text-[#cfb28c]">{shareNotice}</span>}
          </div>
        </div>
      </section>

      <NftDetailsTabs key={nft.id} nft={nft} />

      <section
        aria-label="Mais desta coleção"
        className="min-h-[430px] border-t border-[#624230] pt-7"
      >
        <h2 className="mb-8 font-bold text-[#e89b55]">Mais desta coleção</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {related.isError ? (
            <p className="col-span-full text-sm text-[#cfb28c]" role="status">
              Não foi possível carregar outras obras no momento.
            </p>
          ) : related.data
            ? related.data.items
                .filter(item => item.id !== nft.id)
                .slice(0, 5)
                .map(item => <NftCard key={item.id} nft={item} compact />)
            : Array.from({ length: 5 }, (_, index) => (
                <Skeleton
                  key={index}
                  className="aspect-square w-full rounded-lg"
                  aria-hidden="true"
                />
              ))}
        </div>
      </section>
    </main>
  )
}