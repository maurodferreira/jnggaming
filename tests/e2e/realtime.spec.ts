import { expect, test, type Page } from '@playwright/test'

async function waitForSocket(page: Page) {
  await expect.poll(async () => {
    return await page.evaluate(async () => {
      const response = await fetch('/api/mock/socket-status')
      const status: { connections: number } = await response.json()
      return status.connections
    })
  }, { timeout: 12_000, message: 'socket.io-client should connect to the MSW WebSocket mock' }).toBeGreaterThan(0)
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /SEJA DONO/i })).toBeVisible()
  await page.evaluate(async () => {
    const response = await fetch('/api/mock/reset-all', { method: 'POST' })
    if (!response.ok) throw Error('Could not reset demo state')
  })
  await page.reload()
})

test('Socket.IO delivers versioned NFT changes and refreshes the catalog', async ({ page }) => {
  await waitForSocket(page)
  const updated = await page.evaluate(async () => {
    const response = await fetch('/api/mock/nfts/1/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceEth: '1.44', available: 14 }),
    })
    if (!response.ok) throw Error('Could not change the mock NFT')
    return response.json()
  })
  expect(updated.resourceId).toBe('1')
  expect(updated.version).toBeGreaterThan(0)
  await expect(page.getByRole('status').filter({ hasText: 'Um NFT foi atualizado.' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Emerald Ape #042, 1\.44 ETH/ })).toBeVisible()
})

test('REST reconciles the changed price after reloading the page', async ({ page }) => {
  await waitForSocket(page)
  await page.evaluate(async () => {
    await fetch('/api/mock/nfts/1/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceEth: '1.55', available: 6 }),
    })
  })
  await page.reload()
  await expect(page.getByRole('link', { name: /Emerald Ape #042, 1\.55 ETH/ })).toBeVisible()
})
