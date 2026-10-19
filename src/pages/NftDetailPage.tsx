import axios from 'axios'
import { Link, getRouteApi } from '@tanstack/react-router'
import { useNft } from '@/features/catalog/useNft'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const routeApi = getRouteApi('/nft/$nftId')

export function NftDetailPage() {
  const { nftId } = routeApi.useParams()
  const { data: nft, isPending, error, refetch } = useNft(nftId)

  if (isPending) {
    return (
      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-12 w-64" />
      </main>
    )
  }

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

        <div>

          <Link
            to="/"
            search={{
              q: '',
              collection: 'all',
              available: false,
              sort: 'name_asc',
              page: 1,
            }}
            className="underline"
          >
            Voltar ao catálogo
          </Link>

        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10">

      <Link
        to="/"
        search={{
          q: '',
          collection: 'all',
          available: false,
          sort: 'name_asc',
          page: 1,
        }}
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Voltar ao catálogo
      </Link>


      <section className="grid gap-8 md:grid-cols-2">
        <div className="flex min-h-80 items-center justify-center rounded-xl border bg-muted/30">
          <p className="text-sm text-muted-foreground">
            Imagem do NFT
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-muted-foreground">
              {nft.collection}
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              {nft.name}
            </h1>
          </div>

          <div className="rounded-xl border p-5">
            <p className="text-sm text-muted-foreground">
              Preço
            </p>

            <p className="mt-2 text-3xl font-semibold">
              {nft.priceEth} ETH
            </p>
          </div>

          <p className="text-sm">
            {nft.available > 0
              ? `${nft.available} unidades disponíveis`
              : 'NFT esgotado'}
          </p>
        </div>
      </section>
    </main>
  )
}