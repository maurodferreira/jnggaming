import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/useAuth'
import type { NftUpdatedEvent, OrderUpdatedEvent } from './types'

/**
 * The real Socket.IO client is imported only after the MSW worker has started.
 * Socket.IO captures the WebSocket constructor, so import order matters.
 */
export function useRealtime() {
  const queryClient = useQueryClient()
  const session = useSession()
  const [notice, setNotice] = useState('')
  const versions = useRef(new Map<string, number>())
  const accountId = session.data?.id ?? null

  useEffect(() => {
    if (session.isPending) return
    let cancelled = false
    let dispose: (() => void) | undefined
    versions.current.clear()

    // O catálogo recebe prioridade na primeira pintura. O tempo real
    // conecta logo depois, sem impedir navegação nem a consulta REST.
    const timeoutId = window.setTimeout(() => {
      void import('socket.io-client').then(({ io }) => {
        if (cancelled) return
        const socket = io(window.location.origin, {
          path: '/socket.io/',
          transports: ['websocket'],
          reconnection: true,
          reconnectionDelay: 500,
          reconnectionDelayMax: 4000,
          timeout: 5000,
          forceNew: true,
          autoConnect: false,
        })

        const isNew = (resource: string, version: number) => {
          if (!Number.isSafeInteger(version) || version <= 0) return false
          const previous = versions.current.get(resource) ?? 0
          if (version <= previous) return false
          versions.current.set(resource, version)
          return true
        }

        const reconcile = () => {
          void queryClient.invalidateQueries({ queryKey: ['nfts'] })
          void queryClient.invalidateQueries({ queryKey: ['cart'] })
          if (accountId) {
            void queryClient.invalidateQueries({ queryKey: ['quote', accountId] })
            void queryClient.invalidateQueries({ queryKey: ['order', accountId] })
          }
        }

        socket.on('connect', () => {
          const token = localStorage.getItem('kurio:demo:access-token:v1')
          if (token && accountId) socket.emit('session.subscribe', { token })
          // The initial REST queries are already loading the current snapshot.
          // Invalidating them here makes the first socket connection trigger
          // an unnecessary second fetch during the critical mobile paint.
        })

        socket.io.on('reconnect', () => {
          // A missed event while offline needs a fresh REST snapshot.
          versions.current.clear()
          reconcile()
        })

        socket.on('nft.updated', (data: NftUpdatedEvent) => {
          if (!data || typeof data.resourceId !== 'string' ||
              !isNew(`nft:${data.resourceId}`, data.version)) return
          void queryClient.invalidateQueries({ queryKey: ['nfts'] })
          void queryClient.invalidateQueries({ queryKey: ['cart'] })
          if (accountId) void queryClient.invalidateQueries({ queryKey: ['quote', accountId] })
          setNotice('Um NFT foi atualizado. Preço e disponibilidade foram conferidos novamente.')
        })

        socket.on('order.updated', (data: OrderUpdatedEvent) => {
          if (!accountId || data?.userId !== accountId ||
              !isNew(`order:${accountId}:${data.resourceId}`, data.version)) return
          void queryClient.invalidateQueries({ queryKey: ['order', accountId, data.resourceId] })
          void queryClient.invalidateQueries({ queryKey: ['cart', accountId] })
          setNotice('O estado do pedido foi atualizado na demonstração.')
        })

        socket.connect()
        dispose = () => {
          socket.removeAllListeners()
          socket.io.removeAllListeners('reconnect')
          socket.disconnect()
        }
      }).catch(() => {
        // O REST continua sendo a fonte de verdade quando o socket falha.
      })
    }, 700)

    return () => {
      window.clearTimeout(timeoutId)
      cancelled = true
      dispose?.()
    }
  }, [accountId, queryClient, session.isPending])

  return notice
}
