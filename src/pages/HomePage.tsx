import { useState, type FormEvent } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { ArrowRight, Search, SlidersHorizontal } from 'lucide-react'
import { useNfts } from '@/features/catalog/useNfts'
import type { CatalogFilters, CatalogSort } from '@/features/catalog/types'
import { NftCard } from '@/components/catalog/NftCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const routeApi = getRouteApi('/')
const categories = ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Colecionáveis', 'Generativa', 'Jogos', 'Assinaturas', 'Utilidade']
const resetFilters: CatalogFilters = {
  q: '',
  collection: 'all',
  available: false,
  sort: 'featured',
  page: 1,
}

const articles = [
  { id: '1', date: '12 de setembro · 6 min', title: 'Como funciona a propriedade de NFTs', text: 'Aprenda a colecionar, negociar e verificar ativos digitais.' },
  { id: '3', date: '13 de setembro · 2 min', title: '10 artistas digitais para acompanhar', text: 'Conheça criadores que moldam a cultura digital.' },
  { id: '2', date: '15 de setembro · 3 min', title: 'Raridade, atributos e procedência', text: 'Entenda raridade, procedência, direitos autorais e utilidade.' },
  { id: '7', date: '15 de setembro · 2 min', title: 'Como proteger sua carteira', text: 'Conheça cuidados de segurança digital.' },
]

const images: Record<string, string> = {
  '1': '/assets/nfts/emerald-ape.png',
  '2': '/assets/nfts/sage-nomad.png',
  '3': '/assets/nfts/neon-vessel.png',
  '7': '/assets/nfts/golden-beat.png',
}

export function HomePage() {
  const filters = routeApi.useSearch()
  const navigate = useNavigate({ from: '/' })
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const { data, isPending, isError, isFetching, refetch } = useNfts(filters)

  function updateFilters(patch: Partial<CatalogFilters>) {
    void navigate({ search: previous => ({ ...previous, ...patch }) })
  }

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    updateFilters({ q: String(form.get('q') ?? '').trim(), page: 1 })
  }

  const tabs: { label: string; sort: CatalogSort }[] = [
    { label: 'Todos os NFTs', sort: 'featured' },
    { label: 'Novos lançamentos', sort: 'newest' },
    { label: 'Em alta', sort: 'trending' },
  ]

  return (
    <main className="mx-auto w-full max-w-[1248px] px-5 pb-20 pt-10 text-foreground md:px-6 md:pb-0 md:pt-8">
      <div className="mb-4 flex items-center gap-2 md:hidden">
        <form onSubmit={search} role="search" className="flex h-[45px] min-w-0 flex-1 items-center gap-2 rounded-[10px] bg-[#241612] px-3">
          <Search size={19} className="shrink-0 text-[#b39463]" aria-hidden="true" />
          <input
            key={filters.q}
            name="q"
            type="search"
            defaultValue={filters.q}
            aria-label="Explorar coleções"
            placeholder="Explorar coleções"
            className="w-full min-w-0 bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-[#b39463]"
          />
          <button className="sr-only" type="submit">Buscar NFTs</button>
        </form>
        <button
          type="button"
          className="flex size-[45px] shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          aria-expanded={mobileFiltersOpen}
          aria-controls="catalog-filters"
          aria-label={mobileFiltersOpen ? 'Fechar filtros' : 'Abrir filtros'}
        >
          <SlidersHorizontal size={21} />
        </button>
      </div>

      <section aria-label="Apresentação da Kurio" className="relative isolate overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_85%_25%,#6f492a_0%,#3d2418_42%,#20130e_100%)]">
        <div className="relative flex min-h-[190px] items-center justify-between gap-3 p-4 md:min-h-[450px] md:gap-12 md:p-10">
          <div className="z-10 min-w-0 flex-1 space-y-3 md:max-w-[600px] md:space-y-7">
            <div className="space-y-2">
              <p className="text-[11px] font-medium tracking-wide text-foreground md:text-sm">Bem-vindo à Kurio</p>
              <h1 className="text-[17px] font-bold uppercase leading-[1.55] md:text-[clamp(2rem,3.4vw,43px)] md:leading-[1.6]">
                <span className="hidden md:inline">SEJA DONO DO FUTURO<br/>DA ARTE DIGITAL</span>
                <span className="md:hidden">SEJA DONO DA<br/>CULTURA DIGITAL</span>
              </h1>
            </div>
            <p className="max-w-[560px] text-[11px] leading-[17px] text-[#cfb28c] md:text-sm md:leading-6">
              <span className="hidden md:inline">Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.</span>
              <span className="md:hidden">Descubra NFTs selecionados de criadores do mundo todo.</span>
            </p>
            <a href="#market" className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline md:rounded-md md:bg-primary md:px-7 md:py-3 md:text-sm md:text-primary-foreground md:no-underline md:hover:bg-[#e89b55]">
              EXPLORAR <ArrowRight size={16} className="md:hidden" />
            </a>
          </div>
          <div className="relative w-[40%] max-w-[450px] shrink-0 md:w-[42%]">
            <img
              src="/assets/nfts/emerald-ape.png"
              alt="Emerald Ape, macaco com jaqueta verde e óculos"
              className="aspect-square w-full rounded-2xl object-cover shadow-xl"
              fetchPriority="high"
            />
            <img
              src="/assets/nfts/sage-nomad.png"
              alt=""
              aria-hidden="true"
              className="absolute -bottom-2 -left-2 block size-[45%] max-h-[70px] max-w-[70px] rounded-xl border-2 border-[#6f492a] object-cover shadow-xl md:hidden"
            />
          </div>
        </div>
      </section>

      <section id="market" aria-label="Mercado de NFTs" className="mt-10 scroll-mt-6 lg:mt-24">
        <div className="grid items-start gap-8 lg:grid-cols-[310px_minmax(0,1fr)] lg:gap-12">
          <aside
            id="catalog-filters"
            aria-label="Filtros do catálogo"
            className={`${mobileFiltersOpen ? 'block' : 'hidden'} rounded-lg bg-[#241612] p-5 lg:block`}
          >
            <form onSubmit={search} role="search" className="mb-8 hidden gap-2 lg:flex">
              <Input key={filters.q} name="q" defaultValue={filters.q} aria-label="Buscar NFTs" placeholder="Buscar NFTs..." className="min-w-0 bg-background"/>
              <Button type="submit" aria-label="Buscar" size="icon"><Search size={18}/></Button>
            </form>

            <div className="space-y-4">
              <h2 className="text-[18px] font-bold">Coleções</h2>
              <div className="space-y-1 pl-2">
                <button type="button" onClick={() => updateFilters({ collection: 'all', page: 1 })} className={`block w-full py-2 text-left text-sm hover:text-primary ${filters.collection === 'all' ? 'font-bold text-[#e89b55]' : 'text-[#cfb28c]'}`}>Todas as coleções</button>
                {categories.map(category => (
                  <button
                    type="button"
                    key={category}
                    onClick={() => updateFilters({ collection: category, page: 1 })}
                    className={`block w-full py-2 text-left text-sm transition-colors hover:text-primary ${filters.collection === category ? 'font-bold text-[#e89b55]' : 'text-[#cfb28c]'}`}
                    aria-pressed={filters.collection === category}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-9 space-y-4">
              <h2 className="text-[18px] font-bold">Faixa de preço</h2>
              <div className="space-y-3 pl-2 text-sm text-[#cfb28c]">
                <p>Ordene os NFTs pelo valor em ETH.</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={`rounded-md border px-3 py-2 ${filters.sort === 'price_asc' ? 'border-primary bg-primary text-primary-foreground' : 'border-[#624230]'}`} onClick={() => updateFilters({ sort: 'price_asc', page: 1 })}>Menor preço</button>
                  <button type="button" className={`rounded-md border px-3 py-2 ${filters.sort === 'price_desc' ? 'border-primary bg-primary text-primary-foreground' : 'border-[#624230]'}`} onClick={() => updateFilters({ sort: 'price_desc', page: 1 })}>Maior preço</button>
                </div>
              </div>
            </div>

            <div className="mt-9 space-y-4">
              <h2 className="text-[18px] font-bold">Disponibilidade</h2>
              <label className="flex cursor-pointer items-center gap-3 pl-2 text-sm text-[#cfb28c]">
                <input className="accent-[#d28a4c]" type="checkbox" checked={filters.available} onChange={event => updateFilters({ available: event.target.checked, page: 1 })}/>
                Somente disponíveis
              </label>
            </div>

            <Button type="button" variant="outline" className="mt-9 w-full" onClick={() => updateFilters(resetFilters)}>Limpar filtros</Button>
          </aside>

          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3 border-b border-[#624230] pb-4">
              <div role="group" aria-label="Ordenar catálogo" className="flex min-w-0 items-center gap-3 overflow-x-auto whitespace-nowrap md:gap-6">
                {tabs.map(tab => (
                  <button
                    key={tab.sort}
                    type="button"
                    aria-pressed={filters.sort === tab.sort}
                    onClick={() => updateFilters({ sort: tab.sort, page: 1 })}
                    className={`shrink-0 border-b-2 pb-2 text-xs transition-colors md:text-sm ${filters.sort === tab.sort ? 'border-primary font-bold text-[#e89b55]' : 'border-transparent hover:text-primary'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="hidden shrink-0 items-center gap-2 text-xs xl:flex">
                <span id="catalog-sort-label">Ordenar por:</span>
                <Select
                  value={filters.sort}
                  onValueChange={value => {
                    if (value) updateFilters({ sort: value as CatalogSort, page: 1 })
                  }}
                >
                  <SelectTrigger aria-labelledby="catalog-sort-label" className="h-9 w-[190px] rounded-md border-[#624230] bg-[#241612] text-xs text-[#f5f1eb] hover:border-primary focus-visible:ring-2 focus-visible:ring-primary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end" sideOffset={6} className="z-[100] rounded-lg border-[#624230] bg-[#241612] text-[#f5f1eb] shadow-xl">
                    <SelectItem value="featured">Destaques</SelectItem>
                    <SelectItem value="newest">Listados recentemente</SelectItem>
                    <SelectItem value="trending">Em alta</SelectItem>
                    <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
                    <SelectItem value="price_asc">Menor preço</SelectItem>
                    <SelectItem value="price_desc">Maior preço</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isPending ? (
              <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-7 lg:grid-cols-3" aria-label="Carregando NFTs">
                {Array.from({ length: 9 }, (_, index) => <Skeleton key={index} className="aspect-square rounded-xl"/>)}
              </div>
            ) : isError ? (
              <div role="alert" className="mt-8 rounded-lg bg-[#241612] p-6">
                <p>Não foi possível carregar os NFTs.</p>
                <Button className="mt-3" onClick={() => void refetch()}>Tentar novamente</Button>
              </div>
            ) : data.items.length === 0 ? (
              <div className="mt-8 rounded-lg bg-[#241612] p-8 text-center">
                <p>Nenhum NFT encontrado.</p>
                <Button variant="outline" className="mt-4" onClick={() => updateFilters(resetFilters)}>Limpar filtros</Button>
              </div>
            ) : (
              <>
                <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-7 md:gap-y-12 lg:grid-cols-3">
                  {data.items.map(nft => <NftCard key={nft.id} nft={nft}/>)}
                </div>
                <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                  <p role="status" className="text-xs text-muted-foreground">{data.total} NFTs encontrados {isFetching ? '· Atualizando...' : ''}</p>
                  {data.totalPages > 1 && (
                    <nav aria-label="Paginação do catálogo" className="flex items-center gap-2">
                      <Button size="sm" variant="outline" disabled={filters.page <= 1} onClick={() => updateFilters({ page: filters.page - 1 })}>Anterior</Button>
                      <span className="px-2 text-xs">{filters.page} / {data.totalPages}</span>
                      <Button size="sm" variant="outline" disabled={filters.page >= data.totalPages} onClick={() => updateFilters({ page: filters.page + 1 })}>Próxima</Button>
                    </nav>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mt-24 hidden grid-cols-2 gap-7 md:grid" aria-label="Coleções em destaque">
        <div className="flex min-h-[230px] overflow-hidden rounded-lg bg-[#573523]">
          <img className="h-full w-[48%] object-cover" src="/assets/nfts/emerald-ape.png" alt="Arte da coleção Emerald Ape" loading="lazy"/>
          <div className="flex flex-1 flex-col justify-center gap-3 p-5">
            <h2 className="text-lg font-bold">Lançamentos especiais de edição limitada</h2>
            <p className="text-xs leading-5 text-[#cfb28c]">Colecione edições escassas diretamente dos criadores.</p>
            <a href="#market" className="inline-flex w-fit items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">Explorar <ArrowRight size={14}/></a>
          </div>
        </div>
        <div className="flex min-h-[230px] overflow-hidden rounded-lg bg-[#38241a]">
          <img className="h-full w-[48%] object-cover" src="/assets/nfts/neon-vessel.png" alt="Arte da coleção Neon Vessel" loading="lazy"/>
          <div className="flex flex-1 flex-col justify-center gap-3 p-5">
            <h2 className="text-lg font-bold">Arte digital selecionada e muito mais</h2>
            <p className="text-xs leading-5 text-[#cfb28c]">Explore novos artistas e coleções verificadas.</p>
            <a href="#market" className="inline-flex w-fit items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">Explorar <ArrowRight size={14}/></a>
          </div>
        </div>
      </section>

      <section id="learn" className="mt-24 hidden scroll-mt-10 md:block" aria-label="Diário da Cunhagem">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold">Diário da Cunhagem</h2>
          <p className="mt-3 text-sm text-[#cfb28c]">Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.</p>
        </div>
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {articles.map(article => (
            <article key={article.title} className="overflow-hidden rounded-md bg-[#241612]">
              <img className="aspect-[268/195] w-full object-cover" src={images[article.id]} alt="Imagem ilustrativa do artigo" loading="lazy"/>
              <div className="space-y-3 p-4">
                <p className="text-[10px] text-[#cfb28c]">{article.date}</p>
                <h3 className="text-sm font-bold">{article.title}</h3>
                <p className="text-xs leading-5 text-[#cfb28c]">{article.text}</p>
                <p className="text-xs text-primary">Artigo em preparação</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
