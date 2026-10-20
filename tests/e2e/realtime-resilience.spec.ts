import { expect, test, type Page } from '@playwright/test'

async function socketCount(page: Page) {
  return page.evaluate(async () => {
    const response = await fetch('/api/mock/socket-status')
    // Before MSW finishes starting, Vite can reply with index.html.
    // Wait for the JSON handler instead of parsing that HTML as a socket result.
    if (!response.ok || !response.headers.get('content-type')?.includes('json')) {
      return 0
    }
    const status: { connections: number } = await response.json()
    return status.connections
  })
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /SEJA DONO/i })).toBeVisible()
  const reset = await page.evaluate(async () => {
    const response = await fetch('/api/mock/reset-all', { method: 'POST' })
    return response.ok
  })
  expect(reset).toBe(true)
  await page.reload()
  await expect.poll(() => socketCount(page), { timeout: 15_000 }).toBeGreaterThan(0)
})

test('reconnect reconciles a missed price update through REST', async ({ page }) => {
  test.setTimeout(35_000)

  const result = await page.evaluate(async () => {
    // A dropped WebSocket must not prevent an HTTP update in the mock API.
    const dropped = await fetch('/api/mock/socket/disconnect', { method: 'POST' })
    if (!dropped.ok) throw Error('Could not close the demo socket')
    const info: { affected: number } = await dropped.json()
    const changed = await fetch('/api/mock/nfts/1/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceEth: '1.88', available: 11, broadcast: false }),
    })
    if (!changed.ok) throw Error('Offline price change was rejected')
    return info.affected
  })
  expect(result).toBeGreaterThan(0)

  await expect.poll(() => socketCount(page), { timeout: 20_000 }).toBeGreaterThan(0)
  await expect(
    page.getByRole('link', { name: /Emerald Ape #042, 1\.88 ETH/ }),
  ).toBeVisible({ timeout: 15_000 })

  // REST is authoritative even if the socket was interrupted during a change.
  await page.reload()
  await expect(
    page.getByRole('link', { name: /Emerald Ape #042, 1\.88 ETH/ }),
  ).toBeVisible()
})

test('replayed and stale events leave the newest NFT state intact', async ({ page }) => {
  // CI runners may need longer to finish the REST invalidation triggered by Socket.IO.
  test.setTimeout(35_000)
  const outcome = await page.evaluate(async () => {
    async function update(priceEth: string) {
      const response = await fetch('/api/mock/nfts/1/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceEth, available: 14 }),
      })
      if (!response.ok) throw Error('NFT update failed')
      return response.json() as Promise<{ version: number }>
    }
    return { first: await update('1.21'), latest: await update('1.79') }
  })

  expect(outcome.latest.version).toBeGreaterThan(outcome.first.version)
  await expect(
    page.getByRole('link', { name: /Emerald Ape #042, 1\.79 ETH/ }),
  ).toBeVisible({ timeout: 15_000 })

  for (const version of [outcome.latest.version, outcome.first.version]) {
    const result = await page.evaluate(async replayVersion => {
      const response = await fetch('/api/mock/nfts/1/replay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: replayVersion }),
      })
      return response.ok
    }, version)
    expect(result).toBe(true)
  }

  await expect(
    page.getByRole('link', { name: /Emerald Ape #042, 1\.79 ETH/ }),
  ).toBeVisible()
})
