/**
 * Assets are copied from the original Figma file, not temporary Figma URLs.
 * Repeated portraits reflect the original Kurio catalog mockups.
 */
const artwork: Record<string, string> = {
  '1': '/assets/nfts/emerald-ape.png',
  '2': '/assets/nfts/sage-nomad.png',
  '3': '/assets/nfts/neon-vessel.png',
  '4': '/assets/nfts/sage-nomad.png',
  '5': '/assets/nfts/sage-nomad.png',
  '6': '/assets/nfts/neon-vessel.png',
  '7': '/assets/nfts/golden-beat.png',
  '8': '/assets/nfts/golden-beat.png',
  '9': '/assets/nfts/golden-beat.png',
  '10': '/assets/nfts/emerald-ape.png',
  '11': '/assets/nfts/neon-vessel.png',
  '12': '/assets/nfts/sage-nomad.png',
  '13': '/assets/nfts/golden-beat.png',
  '14': '/assets/nfts/emerald-ape.png',
  '15': '/assets/nfts/neon-vessel.png',
}

export function getNftArtwork(id: string): string {
  return artwork[id] ?? '/assets/nfts/emerald-ape.png'
}
