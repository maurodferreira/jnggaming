import type { NftDetail } from '@/features/catalog/types'

interface NftMetadataProps {
  nft: NftDetail
  className?: string
}

/** Display-only attributes from the mock API; no on-chain lookup is implied. */
export function NftMetadata({ nft, className = '' }: NftMetadataProps) {
  return (
    <section aria-label="Metadados demonstrativos" className={className}>
      <dl className="space-y-1 text-xs leading-5 text-[#cfb28c] sm:leading-6">
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
          <dd>
            {nft.metadata.attributes.length > 0
              ? nft.metadata.attributes.join(', ')
              : 'Não informados nesta demonstração'}
          </dd>
        </div>
      </dl>
    </section>
  )
}
