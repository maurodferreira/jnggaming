/**
 * High-quality WebP copies come from the original Figma PNG artworks.
 * Keep the original PNGs in public/assets/nfts for provenance and review.
 * Repeated portraits follow the existing Kurio catalog mockup.
 */
const artwork: Record<string, string> = {
  '1': '/assets/nfts/emerald-ape.webp',
  '2': '/assets/nfts/sage-nomad.webp',
  '3': '/assets/nfts/neon-vessel.webp',
  '4': '/assets/nfts/sage-nomad.webp',
  '5': '/assets/nfts/sage-nomad.webp',
  '6': '/assets/nfts/neon-vessel.webp',
  '7': '/assets/nfts/golden-beat.webp',
  '8': '/assets/nfts/golden-beat.webp',
  '9': '/assets/nfts/golden-beat.webp',
  '10': '/assets/nfts/emerald-ape.webp',
  '11': '/assets/nfts/neon-vessel.webp',
  '12': '/assets/nfts/sage-nomad.webp',
  '13': '/assets/nfts/golden-beat.webp',
  '14': '/assets/nfts/emerald-ape.webp',
  '15': '/assets/nfts/neon-vessel.webp',
}

export function getNftArtwork(id: string): string {
  return artwork[id] ?? '/assets/nfts/emerald-ape.webp'
}

/** Optimized 400px versions for catalog cards; full art remains in the NFT gallery. */
export function getNftThumbnail(id: string): string {
  return getNftArtwork(id).replace('/assets/nfts/', '/assets/nfts/thumbs/')
}
