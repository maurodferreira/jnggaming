import { Heart } from 'lucide-react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useFavorites, useToggleFavorite } from '@/features/account/useAccount'
import { useSession } from '@/features/auth/useAuth'

export function FavoriteButton({
  nftId,
  className = '',
}: {
  nftId: string
  className?: string
}) {
  const session = useSession()
  const favorites = useFavorites()
  const mutation = useToggleFavorite()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: state => state.location.pathname })
  const isFavorite = favorites.data?.includes(nftId) ?? false

  function handleClick() {
    if (!session.data) {
      const next = /^\/nft\/[A-Za-z0-9-]+$/.test(pathname) ? pathname : '/'
      void navigate({ to: '/login', search: { next } })
      return
    }
    mutation.mutate({ nftId, isFavorite })
  }

  return (
    <span className={`inline-flex flex-col items-center ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={mutation.isPending}
        aria-pressed={isFavorite}
        aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        title={session.data ? 'Gerenciar favorito' : 'Entre para salvar favoritos'}
        className="flex size-9 items-center justify-center rounded-full border border-[#624230] bg-[#241612]/95 text-[#e89b55] transition-colors hover:bg-[#3e281d] focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
      >
        <Heart size={19} fill={isFavorite ? 'currentColor' : 'none'}/>
      </button>
      {mutation.isError && <span role="alert" className="mt-1 max-w-[150px] text-center text-[9px] text-destructive">Não foi possível atualizar o favorito.</span>}
    </span>
  )
}
