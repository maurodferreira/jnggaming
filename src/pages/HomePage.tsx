import { Link, getRouteApi, useNavigate } from '@tanstack/react-router'
import { useNfts } from '@/features/catalog/useNfts'
import type { CatalogFilters, CatalogSort } from '@/features/catalog/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const routeApi = getRouteApi('/')

export function HomePage() {
    const filters = routeApi.useSearch()
    const navigate = useNavigate({ from: '/' })

    const {
        data,
        isPending,
        isError,
        isFetching,
        refetch,
    } = useNfts(filters)

    function updateFilters(patch: Partial<CatalogFilters>) {
        void navigate({
            search: (previous) => ({
                ...previous,
                ...patch,
            }),
        })
    }

    return (
        <main className="min-h-screen bg-background px-4 py-10 text-foreground">
            <div className="mx-auto max-w-6xl">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold">
                        NFT Marketplace
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Explore nossa coleção de NFTs.
                    </p>
                </header>

                <section aria-label="Filtros do catálogo" className="mb-8 space-y-4">
                    <form
                        className="flex flex-col gap-2 sm:flex-row"
                        onSubmit={(event) => {
                            event.preventDefault()

                            const form = new FormData(event.currentTarget)

                            updateFilters({
                                q: String(form.get('q') ?? '').trim(),
                                page: 1,
                            })
                        }}
                    >
                        <Input
                            key={filters.q}
                            name="q"
                            aria-label="Buscar NFTs"
                            placeholder="Buscar por nome ou coleção..."
                            defaultValue={filters.q}
                        />
                        <Button type="submit">Buscar</Button>
                    </form>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                            <label htmlFor="collection" className="text-sm font-medium">
                                Coleção
                            </label>
                            <select
                                id="collection"
                                value={filters.collection}
                                onChange={(event) =>
                                    updateFilters({
                                        collection: event.target.value,
                                        page: 1,
                                    })
                                }
                                className="h-10 w-full rounded-md border bg-background px-3"
                            >
                                <option value="all">Todas</option>
                                <option value="Nebula">Nebula</option>
                                <option value="Genesis">Genesis</option>
                                <option value="Orbit">Orbit</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="sort" className="text-sm font-medium">
                                Ordenar por
                            </label>
                            <select
                                id="sort"
                                value={filters.sort}
                                onChange={(event) =>
                                    updateFilters({
                                        sort: event.target.value as CatalogSort,
                                        page: 1,
                                    })
                                }
                                className="h-10 w-full rounded-md border bg-background px-3"
                            >
                                <option value="name_asc">Nome (A-Z)</option>
                                <option value="price_asc">Menor preço</option>
                                <option value="price_desc">Maior preço</option>
                            </select>
                        </div>

                        <label className="flex items-center gap-3 self-end rounded-md border px-3 py-2.5 text-sm">
                            <input
                                type="checkbox"
                                checked={filters.available}
                                onChange={(event) =>
                                    updateFilters({
                                        available: event.target.checked,
                                        page: 1,
                                    })
                                }
                            />
                            Somente disponíveis
                        </label>
                    </div>
                </section>

                {isPending ? (
                    <div
                        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                        aria-label="Carregando NFTs"
                    >
                        {Array.from({ length: 6 }).map((_, index) => (
                            <Skeleton
                                key={index}
                                className="h-48 rounded-xl"
                            />
                        ))}
                    </div>
                ) : isError ? (
                    <div role="alert" className="space-y-4">
                        <p>Não foi possível carregar os NFTs.</p>
                        <Button onClick={() => void refetch()}>
                            Tentar novamente
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="mb-4 flex items-center justify-between gap-4">
                            <p role="status" className="text-sm text-muted-foreground">
                                {data.total} NFTs encontrados
                            </p>
                            {isFetching && (
                                <p className="text-sm text-muted-foreground">
                                    Atualizando...
                                </p>
                            )}
                        </div>

                        {data.items.length === 0 ? (
                            <div className="rounded-lg border p-8 text-center">
                                <p>Nenhum NFT encontrado.</p>
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() =>
                                        updateFilters({
                                            q: '',
                                            collection: 'all',
                                            available: false,
                                            sort: 'name_asc',
                                            page: 1,
                                        })
                                    }
                                >
                                    Limpar filtros
                                </Button>
                            </div>
                        ) : (
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {data.items.map((nft) => (
                                    <Link
                                        key={nft.id}
                                        to="/nft/$nftId"
                                        params={{ nftId: nft.id }}
                                        className="block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4"
                                    >
                                        <Card className="h-full transition-shadow hover:shadow-md">
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
                                    </Link>
                                ))}
                            </div>
                        )}

                        {data.totalPages > 1 && (
                            <nav
                                aria-label="Paginação do catálogo"
                                className="mt-8 flex items-center justify-center gap-4"
                            >
                                <Button
                                    variant="outline"
                                    disabled={filters.page <= 1}
                                    onClick={() =>
                                        updateFilters({ page: filters.page - 1 })
                                    }
                                >
                                    Anterior
                                </Button>

                                <span className="text-sm">
                                    Página {filters.page} de {data.totalPages}
                                </span>

                                <Button
                                    variant="outline"
                                    disabled={filters.page >= data.totalPages}
                                    onClick={() =>
                                        updateFilters({ page: filters.page + 1 })
                                    }
                                >
                                    Próxima
                                </Button>
                            </nav>
                        )}
                    </>
                )}
            </div>
        </main>
    )
}