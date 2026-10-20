import { useRef, useState } from 'react'
import { X, ZoomIn } from 'lucide-react'
import { getNftArtwork } from '@/lib/nftArtwork'

type ArtworkView = {
  label: string
  description: string
  className: string
}

// The Figma reference repeats one source artwork across all four thumbnails.
// These controls offer useful close-ups without pretending we have extra NFT art.
const artworkViews: ArtworkView[] = [
  { label: 'Obra completa', description: 'arte completa', className: '' },
  { label: 'Detalhe do rosto', description: 'detalhe do rosto', className: 'scale-[1.42] origin-[50%_32%]' },
  { label: 'Detalhe dos óculos', description: 'detalhe dos óculos', className: 'scale-[2] origin-[50%_30%]' },
  { label: 'Detalhe da roupa', description: 'detalhe da roupa', className: 'scale-[1.6] origin-[50%_85%]' },
]

function ArtworkImage({
  src,
  name,
  view,
  eager = false,
  className = '',
}: {
  src: string
  name: string
  view: ArtworkView
  eager?: boolean
  className?: string
}) {
  return (
    <img
      src={src}
      alt={`${name}, ${view.description}`}
      width={640}
      height={640}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : 'auto'}
      decoding="async"
      className={`aspect-square h-full w-full object-cover transition-transform duration-200 motion-reduce:transition-none ${view.className} ${className}`}
    />
  )
}

export function NftArtworkGallery({ nftId, nftName }: { nftId: string; nftName: string }) {
  const [selectedView, setSelectedView] = useState(0)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const src = getNftArtwork(nftId)
  const selected = artworkViews[selectedView]

  return (
    <section className="relative min-w-0" aria-label={`Galeria de ${nftName}`}>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-[76px_minmax(0,1fr)]">
        <div className="hidden flex-col gap-3 sm:flex" role="group" aria-label="Selecionar visualização da arte">
          {artworkViews.map((view, index) => (
            <button
              key={view.label}
              type="button"
              aria-label={view.label}
              aria-pressed={selectedView === index}
              onClick={() => setSelectedView(index)}
              className={`aspect-square overflow-hidden rounded-lg border-2 bg-[#241612] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${selectedView === index ? 'border-primary' : 'border-[#624230] hover:border-primary/70'}`}
            >
              <ArtworkImage src={src} name={nftName} view={view} />
            </button>
          ))}
        </div>
        <div className="relative self-start overflow-hidden rounded-[24px] bg-[#241612] p-1 sm:rounded-lg sm:p-3">
          <div className="aspect-square overflow-hidden rounded-[20px] sm:rounded-lg" aria-live="polite">
            <ArtworkImage src={src} name={nftName} view={selected} eager />
          </div>
          <div
            className="absolute bottom-4 left-4 flex items-center gap-2 sm:hidden"
            role="group"
            aria-label="Selecionar detalhe da arte"
          >
            {artworkViews.map((view, index) => (
              <button
                key={view.label}
                type="button"
                aria-label={view.label}
                aria-pressed={selectedView === index}
                onClick={() => setSelectedView(index)}
                className={`flex size-8 items-center justify-center rounded-full border border-[#624230] bg-[#241612]/95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${selectedView === index ? 'border-primary' : 'hover:border-primary/70'}`}
              >
                <span className={`size-2.5 rounded-full ${selectedView === index ? 'bg-primary' : 'bg-[#cfb28c]'}`} aria-hidden="true"/>
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label="Ampliar arte"
            onClick={() => dialogRef.current?.showModal()}
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-[#241612]/95 text-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <ZoomIn size={19} aria-hidden="true" />
          </button>
        </div>
      </div>
      <dialog
        ref={dialogRef}
        aria-label={`Arte ampliada de ${nftName}`}
        className="m-auto max-h-[90vh] w-[min(90vw,800px)] max-w-none overflow-visible rounded-xl border border-[#624230] bg-[#241612] p-3 text-foreground shadow-2xl backdrop:bg-black/85"
        onClick={event => {
          if (event.target === event.currentTarget) dialogRef.current?.close()
        }}
      >
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Fechar visualização ampliada"
          className="absolute right-5 top-5 z-10 flex size-10 items-center justify-center rounded-full bg-[#241612]/95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <X size={22} aria-hidden="true" />
        </button>
        <div className="aspect-square w-full overflow-hidden rounded-lg">
          <ArtworkImage src={src} name={nftName} view={selected} eager />
        </div>
        <p className="pt-3 text-center text-xs text-[#cfb28c]">
          {selected.label} · A visualização usa a arte original do NFT.
        </p>
      </dialog>
    </section>
  )
}
