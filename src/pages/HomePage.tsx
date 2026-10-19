
import { useNfts } from '@/features/catalog/useNfts'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

export function HomePage() {
  const {
    data,
    isPending,
    isError,
    isFetching,
    refetch,
  } = useNfts()

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10">
          <h1 className="text-3xl font-bold">
            NFT Marketplace
          </h1>

          <p className="mt-2 text-muted-foreground">
            Explore nossa coleção de NFTs.
          </p>
        </header>

        {isPending ? (
          <div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            aria-label="Carregando NFTs"
          >
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-52 rounded-xl"
              />
            ))}
          </div>
        ) : isError ? (
          <div role="alert" className="space-y-4">
            <p>
              Não foi possível carregar os NFTs.
            </p>

            <Button onClick={() => void refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          <>
            {isFetching && (
              <p
                role="status"
                className="mb-4 text-sm text-muted-foreground"
              >
                Atualizando catálogo...
              </p>
            )}

            {data.items.length === 0 ? (
              <p role="status">
                Nenhum NFT encontrado.
              </p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data.items.map((nft) => (
                  <Card key={nft.id}>
                    <CardHeader>
                      <CardTitle>{nft.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {nft.collection}
                      </p>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <p className="text-xl font-semibold">
                        {nft.priceEth} ETH
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {nft.available > 0
                          ? `${nft.available} disponíveis`
                          : 'Esgotado'}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
