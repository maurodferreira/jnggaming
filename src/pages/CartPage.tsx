import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import { useNfts } from '@/features/catalog/useNfts'
import { NftCard } from '@/components/catalog/NftCard'
import { getNftArtwork } from '@/lib/nftArtwork'
import {
    useCart,
    useUpdateCartItem,
    useRemoveCartItem,
    getCartErrorMessage,
} from '@/features/cart/useCart'

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

export function CartPage() {
    const { data, isPending, isError, refetch } = useCart()
    const related = useNfts(catalogSearch)
    const updateItem = useUpdateCartItem()
    const removeItem = useRemoveCartItem()
    const [notice, setNotice] = useState('')

    const isUpdating =
        updateItem.isPending || removeItem.isPending

    const mutationError =
        updateItem.error || removeItem.error

    return (
        <main className="min-h-screen bg-background px-5 py-10 pb-20 md:px-6 md:pb-0">
            <div className="mx-auto max-w-[1200px] space-y-8">
                <header className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#e89b55]">
                            Carrinho de NFTs
                        </h1>
                        <p className="mt-2 text-muted-foreground">
                            Confira os NFTs selecionados.
                        </p>
                    </div>

                    <Link
                        to="/"
                        search={catalogSearch}
                        className="text-sm underline underline-offset-4"
                    >
                        Continuar explorando
                    </Link>
                </header>

                {isPending ? (
                    <div className="space-y-4" aria-label="Carregando carrinho">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-40 w-full" />
                    </div>
                ) : isError ? (
                    <div role="alert" className="space-y-4 rounded-xl border p-6">
                        <p>Não foi possível carregar seu carrinho.</p>
                        <Button onClick={() => void refetch()}>
                            Tentar novamente
                        </Button>
                    </div>
                ) : (
                    <>
                        {mutationError && (
                            <p
                                role="alert"
                                className="rounded-lg border border-destructive p-3 text-sm text-destructive"
                            >
                                {getCartErrorMessage(mutationError)}
                            </p>
                        )}

                        {notice && (
                            <p
                                role="status"
                                className="rounded-lg border p-3 text-sm"
                            >
                                {notice}
                            </p>
                        )}

                        {data.items.length === 0 ? (
                            <div className="rounded-xl border p-10 text-center">
                                <h2 className="text-xl font-semibold">
                                    Seu carrinho está vazio
                                </h2>

                                <p className="mt-2 text-muted-foreground">
                                    Explore o catálogo e escolha seus NFTs.
                                </p>

                                <Link
                                    to="/"
                                    search={catalogSearch}
                                    className="mt-6 inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2"
                                >
                                    Explorar NFTs
                                </Link>
                            </div>
                        ) : (
                            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_332px] lg:gap-14">
                                <section
                                    aria-label="Itens do carrinho"
                                    className="space-y-4"
                                >
                                    {data.items.map((item) => (
                                        <article
                                            key={item.id}
                                            className="space-y-4 rounded-lg border border-[#624230]/50 bg-[#241612] p-4"
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-4">
                                                <div className="flex min-w-0 items-center gap-4">
                                                    <img
                                                        src={getNftArtwork(item.nftId)}
                                                        alt={`Arte digital ${item.name}`}
                                                        className="size-[70px] shrink-0 rounded-md object-cover"
                                                    />
                                                    <div className="min-w-0">
                                                        <h2 className="text-sm font-semibold">{item.name}</h2>
                                                        <p className="mt-1 text-xs text-muted-foreground">Edição: {item.editionName}</p>
                                                        <p className="mt-2 text-sm font-bold text-[#e89b55]">{item.unitPriceEth} ETH</p>
                                                        <p className="mt-1 text-xs text-muted-foreground">{item.available} disponíveis</p>
                                                    </div>
                                                </div>

                                                <Button
                                                    variant="outline"
                                                    disabled={isUpdating}
                                                    onClick={() => {
                                                        setNotice('')
                                                        removeItem.mutate(item.id, {
                                                            onSuccess: () => {
                                                                setNotice('Item removido do carrinho.')
                                                            },
                                                        })
                                                    }}
                                                    aria-label={`Remover ${item.name} do carrinho`}
                                                >
                                                    <Trash2 size={16} /> <span className="sr-only">Remover</span>
                                                </Button>
                                            </div>

                                            <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-4">
                                                <div className="flex items-center gap-3">
                                                    <Button
                                                        variant="outline"
                                                        aria-label={`Diminuir quantidade de ${item.name}`}
                                                        disabled={
                                                            isUpdating ||
                                                            item.quantity <= 1 ||
                                                            item.available < 1
                                                        }
                                                        onClick={() => {
                                                            setNotice('')
                                                            updateItem.mutate(
                                                                {
                                                                    id: item.id,
                                                                    quantity: item.quantity - 1,
                                                                },
                                                                {
                                                                    onSuccess: () => {
                                                                        setNotice('Quantidade atualizada.')
                                                                    },
                                                                }
                                                            )
                                                        }}
                                                    >
                                                        −
                                                    </Button>

                                                    <output
                                                        aria-live="polite"
                                                        className="min-w-8 text-center font-medium"
                                                    >
                                                        {item.quantity}
                                                    </output>

                                                    <Button
                                                        variant="outline"
                                                        aria-label={`Aumentar quantidade de ${item.name}`}
                                                        disabled={
                                                            isUpdating ||
                                                            item.quantity >= item.available
                                                        }
                                                        onClick={() => {
                                                            setNotice('')
                                                            updateItem.mutate(
                                                                {
                                                                    id: item.id,
                                                                    quantity: item.quantity + 1,
                                                                },
                                                                {
                                                                    onSuccess: () => {
                                                                        setNotice('Quantidade atualizada.')
                                                                    },
                                                                }
                                                            )
                                                        }}
                                                    >
                                                        +
                                                    </Button>
                                                </div>

                                                <p className="font-semibold text-[#e89b55]">
                                                    {multiplyEth(
                                                        item.unitPriceEth,
                                                        item.quantity
                                                    )} ETH
                                                </p>
                                            </div>
                                        </article>
                                    ))}
                                </section>

                                <aside className="h-fit space-y-5 rounded-lg border border-[#624230] bg-[#241612]/35 p-6">
                                    <h2 className="text-lg font-semibold">
                                        Resumo da carteira
                                    </h2>

                                    <div className="flex justify-between gap-4 text-sm">
                                        <span>Quantidade de itens</span>
                                        <span>{data.totalQuantity}</span>
                                    </div>

                                    <div className="flex justify-between gap-4 border-t pt-4">
                                        <span className="font-medium">Subtotal</span>
                                        <strong className="text-[#e89b55]">{data.subtotalEth} ETH</strong>
                                    </div>

                                    <p className="text-xs text-muted-foreground">
                                        Cupons, taxas e cotação final serão
                                        calculados no checkout.
                                    </p>

                                    <Link
                                        to="/checkout"
                                        className="flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[#e89b55] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                    >
                                        Ir para pagamento simulado
                                    </Link>
                                </aside>
                            </div>
                        )}
                    </>
                )}
                {related.data && (
                    <section aria-label="Colecionadores também viram" className="border-t border-[#624230] pt-8">
                        <h2 className="mb-7 font-semibold text-[#e89b55]">Colecionadores também viram</h2>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                            {related.data.items.slice(0, 5).map(item => <NftCard key={item.id} nft={item} compact />)}
                        </div>
                    </section>
                )}
            </div>
        </main>
    )
}
