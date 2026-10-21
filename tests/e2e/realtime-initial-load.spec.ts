import { expect, test } from '@playwright/test'

/**
 * Opening the catalogue makes a REST request for its initial snapshot.
 * The first Socket.IO handshake should not invalidate that fresh data.
 * Reconnect recovery is covered separately in realtime-resilience.spec.ts.
 */
test('first realtime connection does not refetch an unchanged catalogue', async ({ page }) => {
  const catalogueRequests: string[] = []

  page.on('request', request => {
    const url = new URL(request.url())
    if (request.method() === 'GET' && url.pathname === '/api/nfts') {
      catalogueRequests.push(request.url())
    }
  })

  await page.goto('/')
  await expect(page.getByRole('link', { name: /Ver detalhes de Emerald Ape #042/i })).toBeVisible()

  await expect.poll(async () => page.evaluate(async () => {
    const response = await fetch('/api/mock/socket-status')
    if (!response.ok || !response.headers.get('content-type')?.includes('json')) return 0
    const data: { connections: number } = await response.json()
    return data.connections
  }), { timeout: 12_000 }).toBeGreaterThan(0)

  // Allow the first-connect callback to run so this fails if it invalidates
  // the already-loaded catalogue. No artificial API fixtures are needed.
  await page.waitForTimeout(500)
  expect(catalogueRequests).toHaveLength(1)
})
