/**
 * Assets are copied from the original Figma file, not temporary Figma URLs.
 * Repeated portraits reflect the original Kurio catalog mockups.
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
