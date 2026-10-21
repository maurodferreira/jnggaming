import { Heart } from 'lucide-react'
import { useFavoriteControls } from './FavoritesControlsProvider'

export function FavoriteButton({
  nftId,
  className = '',
}: {
  nftId: string
  className?: string
}) {
  const { signedIn, favorites, pending, errors, toggle } = useFavoriteControls()
  const isFavorite = favorites.has(nftId)

  return (
    <span className={`inline-flex flex-col items-center ${className}`}>
      <button
        type="button"
        onClick={() => toggle(nftId)}
        disabled={pending.has(nftId)}
        aria-pressed={isFavorite}
        aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        title={signedIn ? 'Gerenciar favorito' : 'Entre para salvar favoritos'}
        className="flex size-9 items-center justify-center rounded-full border border-[#624230] bg-[#241612]/95 text-[#e89b55] transition-colors hover:bg-[#3e281d] focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
      >
        <Heart size={19} fill={isFavorite ? 'currentColor' : 'none'}/>
      </button>
      {errors.has(nftId) && <span role="alert" className="mt-1 max-w-[150px] text-center text-[9px] text-destructive">Não foi possível atualizar o favorito.</span>}
    </span>
  )
}
