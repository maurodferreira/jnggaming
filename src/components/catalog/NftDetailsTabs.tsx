import { useRef, useState, type KeyboardEvent } from 'react'
import { Star } from 'lucide-react'
import type { NftDetail } from '@/features/catalog/types'

type DetailsTab = 'details' | 'reviews'

export function NftDetailsTabs({ nft }: { nft: NftDetail }) {
  const [activeTab, setActiveTab] = useState<DetailsTab>('details')
  const detailsRef = useRef<HTMLButtonElement>(null)
  const reviewsRef = useRef<HTMLButtonElement>(null)
  const reviews = nft.metadata.reviewSummary

  function navigateTabs(event: KeyboardEvent<HTMLButtonElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const next: DetailsTab = event.key === 'End' || event.key === 'ArrowRight'
      ? 'reviews'
      : 'details'
    setActiveTab(next)
    if (next === 'reviews') reviewsRef.current?.focus()
    else detailsRef.current?.focus()
  }

  return (
    <section className="space-y-5 border-t border-[#624230] pt-7" aria-label="Informações da obra">
      <div role="tablist" aria-label="Detalhes e avaliações" className="flex gap-5 overflow-x-auto border-b border-[#624230] text-sm">
        <button
          ref={detailsRef}
          id="nft-details-tab"
          type="button"
          role="tab"
          aria-controls="nft-details-panel"
          aria-selected={activeTab === 'details'}
          tabIndex={activeTab === 'details' ? 0 : -1}
          onClick={() => setActiveTab('details')}
          onKeyDown={navigateTabs}
          className={`shrink-0 border-b-2 pb-3 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${activeTab === 'details' ? 'border-primary text-primary' : 'border-transparent text-[#cfb28c]'}`}
        >
          Detalhes do NFT
        </button>
        <button
          ref={reviewsRef}
          id="nft-reviews-tab"
          type="button"
          role="tab"
          aria-controls="nft-reviews-panel"
          aria-selected={activeTab === 'reviews'}
          tabIndex={activeTab === 'reviews' ? 0 : -1}
          onClick={() => setActiveTab('reviews')}
          onKeyDown={navigateTabs}
          className={`shrink-0 border-b-2 pb-3 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${activeTab === 'reviews' ? 'border-primary text-primary' : 'border-transparent text-[#cfb28c]'}`}
        >
          Avaliações de colecionadores{reviews ? ` (${reviews.count})` : ''}
        </button>
      </div>

      <div
        id="nft-details-panel"
        role="tabpanel"
        aria-labelledby="nft-details-tab"
        tabIndex={0}
        hidden={activeTab !== 'details'}
        className="space-y-5 text-sm leading-7 text-[#cfb28c]"
      >
        <p>{nft.metadata.description}</p>
        <dl className="space-y-3">
          <div>
            <dt className="font-semibold text-foreground">Rede:</dt>
            <dd>{nft.network} (rede atribuída aos dados de demonstração).</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">ID do token:</dt>
            <dd>{nft.metadata.tokenId} (identificador ilustrativo, sem token na blockchain).</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Contrato:</dt>
            <dd>Nenhum contrato inteligente real está conectado à demonstração.</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Direitos autorais:</dt>
            <dd>Não há royalties ou transferências financeiras nesta simulação.</dd>
          </div>
        </dl>
      </div>

      <div
        id="nft-reviews-panel"
        role="tabpanel"
        aria-labelledby="nft-reviews-tab"
        tabIndex={0}
        hidden={activeTab !== 'reviews'}
        className="space-y-4 text-sm text-[#cfb28c]"
      >
        {reviews ? (
          <>
            <p className="flex items-center gap-2 text-foreground">
              <Star size={19} className="fill-primary text-primary" aria-hidden="true" />
              <strong>{reviews.average.toFixed(1)}</strong>
              <span>· {reviews.count} avaliações ilustrativas do Figma</span>
            </p>
            <p>Este número faz parte do design de referência. Não há comentários reais de colecionadores cadastrados.</p>
          </>
        ) : (
          <p>Este NFT ainda não possui avaliações na demonstração.</p>
        )}
      </div>
    </section>
  )
}
