import { useState } from 'react'
import axios from 'axios'
import { Link, getRouteApi } from '@tanstack/react-router'

import { useNft } from '@/features/catalog/useNft'
import { useNfts } from '@/features/catalog/useNfts'
import { NftCard } from '@/components/catalog/NftCard'
import { getNftArtwork } from '@/lib/nftArtwork'
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
    <div className="space-y-6">
      {/* Escolha da edição */}
      <fieldset className="space-y-3">
        <legend className="font-medium">
          Escolha uma edição
        </legend>

        <div className="grid gap-3 sm:grid-cols-2">
          {nft.editions.map((edition) => (
            <label
              key={edition.id}
              className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${
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
                className="mt-1 accent-primary"
              />

              <span className="space-y-1">
                <span className="block font-medium">
                  {edition.name}
                </span>

                <span className="block text-sm">
                  {edition.priceEth} ETH
                </span>

                <span className="block text-xs text-muted-foreground">
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
      <div className="space-y-3">
        <p className="font-medium">Quantidade</p>

        <div className="flex items-center gap-4">
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
        </div>

        <p className="text-sm text-muted-foreground">
          {available > 0
            ? `Limite de ${available} unidades nesta edição.`
            : 'Esta edição não está disponível.'}
        </p>
      </div>

      {/* Resumo dos valores */}
      <div className="rounded-xl border p-5">
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

  const related = useNfts(catalogSearch)

  // Carregamento
  if (isPending) {
    return (
      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-12 w-64" />
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
    <main className="mx-auto max-w-[1248px] space-y-8 px-5 py-8 pb-20 md:px-6 md:pb-0">
      <Link
        to="/"
        search={catalogSearch}
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Voltar ao catálogo
      </Link>

      <section className="grid gap-10 lg:grid-cols-2">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-[76px_minmax(0,1fr)]">
          <div className="hidden flex-col gap-3 sm:flex" aria-hidden="true">
            {Array.from({ length: 4 }, (_, index) => (
              <img
                key={index}
                src={getNftArtwork(nft.id)}
                alt=""
                className="aspect-square w-full rounded-md border border-[#624230] object-cover"
              />
            ))}
          </div>
          <div className="self-start rounded-lg bg-[#241612] p-3">
            <img
              src={getNftArtwork(nft.id)}
              alt={`Arte digital ${nft.name}`}
              className="aspect-square w-full rounded-lg object-cover"
            />
          </div>
        </div>

        {/* Informações */}
        <div className="space-y-6">
          <div>
            <p className="text-muted-foreground">
              {nft.collection}
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              {nft.name}
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Conheça esta edição da coleção Kurio. As informações de preço, estoque e compra são demonstrativas.
            </p>
          </div>

          <EditionSelector
            key={nft.id}
            nft={nft}
          />
        </div>
      </section>

      <section aria-label="Descrição do NFT" className="border-t border-[#624230] pt-7">
        <h2 className="mb-4 font-bold text-[#e89b55]">Detalhes do NFT</h2>
        <p className="max-w-4xl text-sm leading-7 text-muted-foreground">
          {nft.name} faz parte da curadoria digital Kurio. Confira as edições disponíveis, escolha a quantidade e adicione ao seu carrinho de demonstração.
        </p>
      </section>

      {related.data && (
        <section aria-label="Mais desta coleção" className="border-t border-[#624230] pt-7">
          <h2 className="mb-8 font-bold text-[#e89b55]">Mais desta coleção</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {related.data.items.filter(item => item.id !== nft.id).slice(0, 5).map(item => (
              <NftCard key={item.id} nft={item} compact />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}