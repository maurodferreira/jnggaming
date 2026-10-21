import { expect, test, type Page } from '@playwright/test'

async function waitForSocket(page: Page) {
  await expect.poll(async () => {
    return await page.evaluate(async () => {
      const response = await fetch('/api/mock/socket-status')
      if (!response.ok || !response.headers.get('content-type')?.includes('json')) {
        return 0
      }
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

test('Socket.IO publishes a confirmed order to the signed-in collector', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill('colecionador@kurio.demo')
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\?q=/)

  // Wait for the actual authenticated Socket.IO subscription, not just REST login.
  await expect.poll(async () => page.evaluate(async () => {
    const response = await fetch('/api/mock/socket-status')
    if (!response.ok) return 0
    const data: { authenticatedConnections: number } = await response.json()
    return data.authenticatedConnections
  }), { timeout: 15_000 }).toBeGreaterThan(0)

  const order = await page.evaluate(async () => {
    const token = localStorage.getItem('kurio:demo:access-token:v1')
    if (!token) throw Error('Demo account has no session token')
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }
    const wallet = await fetch('/api/wallets/primary', {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        label: 'Principal', nickname: 'Carteira do teste',
        network: 'Ethereum', type: 'Software',
        address: `0x${'a'.repeat(40)}`, isPrimary: true,
      }),
    })
    const cart = await fetch('/api/cart/items', {
      method: 'POST', headers,
      body: JSON.stringify({ nftId: '1', editionId: 'standard', quantity: 1 }),
    })
    if (!wallet.ok || !cart.ok) throw Error('Could not set up the mock order')

    const quoteResponse = await fetch('/api/quote?network=Ethereum', { headers })
    const quote: { id: string } = await quoteResponse.json()
    if (!quoteResponse.ok) throw Error('Could not prepare a quote')
    const response = await fetch('/api/orders', {
      method: 'POST', headers,
      body: JSON.stringify({
        idempotencyKey: crypto.randomUUID(), quoteId: quote.id,
        walletId: 'primary', provider: 'Coinbase Wallet',
      }),
    })
    const data: { id: string; status: string } = await response.json()
    if (response.status !== 201) throw Error('Mock order was not created')
    return data
  })

  expect(order.status).toBe('pending')
  await expect(
    page.getByRole('status').filter({ hasText: 'O estado do pedido foi atualizado na demonstração.' }),
  ).toBeVisible({ timeout: 15_000 })

  const updatedStatus = await page.evaluate(async orderId => {
    const token = localStorage.getItem('kurio:demo:access-token:v1')
    const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const order: { status: string } = await response.json()
    return order.status
  }, order.id)
  expect(updatedStatus).toBe('confirmed')
})
