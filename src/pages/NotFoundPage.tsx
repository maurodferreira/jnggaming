import { Link } from '@tanstack/react-router'
import { SearchX } from 'lucide-react'

const catalogSearch = {
  q: '',
  collection: 'all',
  available: false,
  sort: 'featured' as const,
  page: 1,
}

export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center gap-5 px-5 pb-28 pt-12 text-center">
      <SearchX aria-hidden="true" className="text-primary" size={44} strokeWidth={1.5}/>
      <p className="text-xs font-bold tracking-[0.15em] text-primary">ERRO 404</p>
      <h1 className="text-2xl font-bold">Esta página não foi encontrada</h1>
      <p className="text-sm leading-7 text-[#cfb28c]">
        O endereço pode ter mudado ou não fazer parte desta demonstração.
        Seu carrinho e a sessão não foram alterados.
      </p>
      <Link
        to="/"
        search={catalogSearch}
        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-7 text-sm font-bold text-primary-foreground hover:bg-[#e89b55] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Voltar ao catálogo
      </Link>
    </main>
  )
}
