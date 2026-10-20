import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useFavorites, useToggleFavorite } from '@/features/account/useAccount'
import { useSession } from '@/features/auth/useAuth'

type FavoritesControls = {
  signedIn: boolean
  favorites: ReadonlySet<string>
  pending: ReadonlySet<string>
  errors: ReadonlySet<string>
  toggle: (nftId: string) => void
}

const FavoritesControlsContext = createContext<FavoritesControls | null>(null)

/**
 * One query subscription and one mutation controller for all NFT favorites on
 * the active catalog/detail route. Previously every card independently mounted
 * multiple auth/favorites queries and a mutation hook.
 *
 * Per-item pending/error sets preserve independent buttons, including when
 * different NFTs are toggled concurrently.
 */
export function FavoritesControlsProvider({ children }: { children: ReactNode }) {
  const { data: user } = useSession()
  const { data: storedFavorites } = useFavorites()
  const { mutateAsync } = useToggleFavorite()
  const pathname = useRouterState({ select: state => state.location.pathname })
  const navigate = useNavigate()

  const favorites = useMemo(() => new Set(storedFavorites ?? []), [storedFavorites])
  const pendingRef = useRef(new Set<string>())
  const [pending, setPending] = useState<ReadonlySet<string>>(() => new Set())
  const [errors, setErrors] = useState<ReadonlySet<string>>(() => new Set())

  const toggle = useCallback((nftId: string) => {
    if (!user) {
      const next = /^\/nft\/[A-Za-z0-9-]+$/.test(pathname) ? pathname : '/'
      void navigate({ to: '/login', search: { next } })
      return
    }

    if (pendingRef.current.has(nftId)) return
    pendingRef.current.add(nftId)
    setPending(new Set(pendingRef.current))
    setErrors(previous => {
      const next = new Set(previous)
      next.delete(nftId)
      return next
    })

    void mutateAsync({ nftId, isFavorite: favorites.has(nftId) })
      .catch(() => {
        setErrors(previous => new Set(previous).add(nftId))
      })
      .finally(() => {
        pendingRef.current.delete(nftId)
        setPending(new Set(pendingRef.current))
      })
  }, [favorites, mutateAsync, navigate, pathname, user])

  const value = useMemo<FavoritesControls>(() => ({
    signedIn: Boolean(user),
    favorites,
    pending,
    errors,
    toggle,
  }), [user, favorites, pending, errors, toggle])

  return (
    <FavoritesControlsContext.Provider value={value}>
      {children}
    </FavoritesControlsContext.Provider>
  )
}

export function useFavoriteControls() {
  const controls = useContext(FavoritesControlsContext)
  if (!controls) {
    throw new Error('FavoriteButton must render inside FavoritesControlsProvider.')
  }
  return controls
}
