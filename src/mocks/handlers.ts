import { http, HttpResponse, delay } from 'msw'
import { nfts } from './fixtures/nfts'

export const handlers = [
  http.get('/api/nfts', async () => {
    await delay(400)

    return HttpResponse.json({
      items: nfts,
      total: nfts.length,
    })
  }),
]
