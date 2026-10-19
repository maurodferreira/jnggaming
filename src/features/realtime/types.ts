/** Stable, versioned event payloads exchanged over the Socket.IO transport. */
export interface NftUpdatedEvent {
  resourceId: string
  version: number
  priceEth: string
  available: number
}

export interface OrderUpdatedEvent {
  resourceId: string
  userId: string
  version: number
  status: 'pending' | 'confirmed' | 'declined'
}

/** The server always owns the truth. Events are hints to reconcile via REST. */
export type RealtimeEventName = 'nft.updated' | 'order.updated'
