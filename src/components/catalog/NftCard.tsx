import { Link } from '@tanstack/react-router'
import type { Nft } from '@/features/catalog/types'
import { getNftArtwork } from '@/lib/nftArtwork'

interface NftCardProps {
  nft: Nft
  compact?: boolean
}

export function NftCard({ nft, compact = false }: NftCardProps) {
  const isRare = nft.id === '3' || nft.id === '7'

  return (
    <Link
      to="/nft/$nftId"
      params={{ nftId: nft.id }}
      className="group block min-w-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={`Ver detalhes de ${nft.name}, ${nft.priceEth} ETH`}
    >
      <div className="relative overflow-hidden rounded-xl bg-[#241612] p-1 transition-transform duration-200 group-hover:-translate-y-1">
        {isRare && (
          <span className="absolute left-0 top-3 z-10 bg-primary px-3 py-1 text-[10px] font-bold text-primary-foreground">
            RARO
          </span>
        )}
        <img
          src={getNftArtwork(nft.id)}
          alt={`Arte digital ${nft.name}`}
          className={`aspect-square w-full rounded-lg object-cover ${compact ? 'max-h-[240px]' : ''}`}
          loading="lazy"
        />
      </div>
      <div className="pt-3">
        <h3 className="truncate text-[14px] font-medium leading-6 text-foreground md:text-[15px]">{nft.name}</h3>
        <p className="text-[14px] font-bold text-[#e89b55] md:text-[16px]">{nft.priceEth} ETH</p>
        {nft.available === 0 && <p className="text-xs text-muted-foreground">Esgotado</p>}
      </div>
    </Link>
  )
}
