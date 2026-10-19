import { useState } from 'react'
import { Link } from '@tanstack/react-router'
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
    sort: 'name_asc' as const,
    page: 1,
}

export function CartPage() {
    const { data, isPending, isError, refetch } = useCart()
    const updateItem = useUpdateCartItem()
    const removeItem = useRemoveCartItem()
    const [notice, setNotice] = useState('')

    const isUpdating =
        updateItem.isPending || removeItem.isPending

    const mutationError =
        updateItem.error || removeItem.error

    return (
        <main className="min-h-screen bg-background px-4 py-10">
            <div className="mx-auto max-w-5xl space-y-8">
                <header className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Meu carrinho
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
                            <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
                                <section
                                    aria-label="Itens do carrinho"
                                    className="space-y-4"
                                >
                                    {data.items.map((item) => (
                                        <article
                                            key={item.id}
                                            className="space-y-4 rounded-xl border p-5"
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-4">
                                                <div>
                                                    <h2 className="text-lg font-semibold">
                                                        {item.name}
                                                    </h2>

                                                    <p className="text-sm text-muted-foreground">
                                                        Edição: {item.editionName}
                                                    </p>

                                                    <p className="mt-2 font-medium">
                                                        {item.unitPriceEth} ETH / unidade
                                                    </p>

                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {item.available} disponíveis
                                                    </p>
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
                                                >
                                                    Remover
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

                                                <p className="font-semibold">
                                                    {multiplyEth(
                                                        item.unitPriceEth,
                                                        item.quantity
                                                    )} ETH
                                                </p>
                                            </div>
                                        </article>
                                    ))}
                                </section>

                                <aside className="h-fit space-y-5 rounded-xl border p-6">
                                    <h2 className="text-xl font-semibold">
                                        Resumo do carrinho
                                    </h2>

                                    <div className="flex justify-between gap-4 text-sm">
                                        <span>Quantidade de itens</span>
                                        <span>{data.totalQuantity}</span>
                                    </div>

                                    <div className="flex justify-between gap-4 border-t pt-4">
                                        <span className="font-medium">Subtotal</span>
                                        <strong>{data.subtotalEth} ETH</strong>
                                    </div>

                                    <p className="text-xs text-muted-foreground">
                                        Cupons, taxas e cotação final serão
                                        calculados no checkout.
                                    </p>

                                    <Button
                                        className="w-full"
                                        disabled
                                    >
                                        Checkout em desenvolvimento
                                    </Button>
                                </aside>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    )
}
