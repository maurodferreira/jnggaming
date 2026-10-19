import { http, HttpResponse, ws } from 'msw'
import { nfts } from './fixtures/nfts'
import { getUserFromRequest } from './authStore'
import type { NftUpdatedEvent, OrderUpdatedEvent, RealtimeEventName } from '@/features/realtime/types'

/**
 * Minimal Engine.IO v4 / Socket.IO v4 *WebSocket-only* mock adapter.
 *
 * We intentionally use msw@3's built-in `ws` connection interceptor: the
 * published @mswjs/socket.io-binding currently has an MSW v2 peer dependency.
 * A Socket.IO client must complete the 0 -> 40 handshake and send actual 42
 * event packets. Never call React callbacks or Query setters from the mock.
 *
 * This mock does not emulate polling, rooms, binary packets or upgrades.
 */
const link = ws.link(/wss?:\/\/[^/]+\/socket\.io\/?(?:\?.*)?$/)

type LiveClient = {
  emit: (event: RealtimeEventName, data: NftUpdatedEvent | OrderUpdatedEvent) => void
  userId: string | null
}
const connections = new Set<LiveClient>()
const initialNfts = nfts.map(nft => ({ ...nft }))
const versions = new Map<string, number>()

function nextVersion(resource: string) {
  const version = (versions.get(resource) ?? 0) + 1
  versions.set(resource, version)
  return version
}

export function resetRealtimeState() {
  versions.clear()
}

export function resetNftFixtures() {
  for (const initial of initialNfts) {
    const nft = nfts.find(item => item.id === initial.id)
    if (nft) Object.assign(nft, initial)
  }
}

function emitNftUpdated(event: NftUpdatedEvent) {
  for (const connection of connections) {
    connection.emit('nft.updated', event)
  }
}

export function emitOrderUpdated(event: Omit<OrderUpdatedEvent, 'version'>) {
  const payload: OrderUpdatedEvent = {
    ...event,
    version: nextVersion(`order:${event.userId}:${event.resourceId}`),
  }
  for (const connection of connections) {
    if (connection.userId === event.userId) {
      connection.emit('order.updated', payload)
    }
  }
}

export const realtimeSocketHandler = link.addEventListener('connection', ({ client }) => {
  let connected = false
  const peer: LiveClient = {
    userId: null,
    emit: (name, data) => {
      if (!connected) return
      client.send(`42${JSON.stringify([name, data])}`)
    },
  }

  // Send the Engine.IO handshake after the native WebSocket open event.
  queueMicrotask(() => {
    client.send(`0${JSON.stringify({
      sid: crypto.randomUUID(),
      upgrades: [],
      pingInterval: 25000,
      pingTimeout: 20000,
      maxPayload: 1000000,
    })}`)
  })

  client.addEventListener('message', event => {
    if (typeof event.data !== 'string') return
    const packet = event.data
    if (packet === '40' || packet.startsWith('40{')) {
      connected = true
      connections.add(peer)
      client.send(`40${JSON.stringify({ sid: crypto.randomUUID() })}`)
      return
    }
    if (packet === '3') return
    if (!packet.startsWith('42')) return
    try {
      const decoded: unknown = JSON.parse(packet.slice(2))
      if (!Array.isArray(decoded)) return
      const [eventName, payload] = decoded
      if (eventName === 'session.subscribe' && payload &&
          typeof payload === 'object' && 'token' in payload &&
          typeof payload.token === 'string') {
        const request = new Request('http://localhost/api/auth/session', {
          headers: { Authorization: `Bearer ${payload.token}` },
        })
        peer.userId = getUserFromRequest(request)?.id ?? null
        return
      }
      if (eventName === 'demo.ping') {
        client.send('42["demo.pong",{}]')
      }
    } catch {
      // Ignore unsupported or malformed mock protocol packets.
    }
  })

  client.addEventListener('close', () => {
    connected = false
    connections.delete(peer)
  })
})

export const realtimeScenarioHandlers = [
  http.post('/api/mock/nfts/:id/update', async ({ params, request }) => {
    const id = String(params.id)
    const original = nfts.find(item => item.id === id)
    if (!original) return HttpResponse.json({ message: 'NFT não encontrado.' }, { status: 404 })
    const body = await request.json().catch(() => null) as {
      priceEth?: unknown
      available?: unknown
    } | null
    if (!body || typeof body.priceEth !== 'string' ||
      !/^\d+(?:\.\d{1,18})?$/.test(body.priceEth) ||
      typeof body.available !== 'number' ||
      !Number.isSafeInteger(body.available) || body.available < 0) {
      return HttpResponse.json({ message: 'Preço ou disponibilidade inválidos.' }, { status: 400 })
    }

    original.priceEth = body.priceEth
    original.available = body.available
    const update: NftUpdatedEvent = {
      resourceId: id,
      version: nextVersion(`nft:${id}`),
      priceEth: original.priceEth,
      available: original.available,
    }
    emitNftUpdated(update)
    return HttpResponse.json(update)
  }),
]
