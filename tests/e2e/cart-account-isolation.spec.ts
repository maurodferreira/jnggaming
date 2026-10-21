import { expect, test, type Page } from '@playwright/test'

async function resetDemo(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /SEJA DONO/i })).toBeVisible()
  const resetOk = await page.evaluate(async () => (
    await fetch('/api/mock/reset-all', { method: 'POST' })
  ).ok)
  expect(resetOk).toBe(true)
}

test.beforeEach(async ({ page }) => {
  await resetDemo(page)
})

test('changing a quantity only updates the signed-in collector cart', async ({ page }) => {
  const result = await page.evaluate(async () => {
    async function login(email: string) {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'KurioDemo123!' }),
      })
      if (!response.ok) throw Error('Could not sign in with a demo account')
      const data: { accessToken: string } = await response.json()
      return { Authorization: `Bearer ${data.accessToken}`, 'Content-Type': 'application/json' }
    }

    const collectorHeaders = await login('colecionador@kurio.demo')
    const add = await fetch('/api/cart/items', {
      method: 'POST',
      headers: collectorHeaders,
      body: JSON.stringify({ nftId: '1', editionId: 'standard', quantity: 1 }),
    })
    if (!add.ok) throw Error('Could not create collector cart')

    const patch = await fetch('/api/cart/items/1-standard', {
      method: 'PATCH',
      headers: collectorHeaders,
      body: JSON.stringify({ quantity: 3 }),
    })
    if (!patch.ok) throw Error('Could not update collector quantity')

    const collectorCart = await fetch('/api/cart', { headers: collectorHeaders })
    const collector: { totalQuantity: number } = await collectorCart.json()

    const guestCart = await fetch('/api/cart')
    const guest: { totalQuantity: number } = await guestCart.json()

    const artistHeaders = await login('artista@kurio.demo')
    const artistCart = await fetch('/api/cart', { headers: artistHeaders })
    const artist: { totalQuantity: number } = await artistCart.json()

    // Visiting another account must not change what the first account owns.
    const collectorAgain = await fetch('/api/cart', { headers: collectorHeaders })
    const afterSwitch: { totalQuantity: number } = await collectorAgain.json()

    return {
      collector: collector.totalQuantity,
      guest: guest.totalQuantity,
      artist: artist.totalQuantity,
      afterSwitch: afterSwitch.totalQuantity,
    }
  })

  expect(result).toEqual({
    collector: 3,
    guest: 0,
    artist: 0,
    afterSwitch: 3,
  })
})

test('a live price change invalidates the previous quote before checkout', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const login = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'colecionador@kurio.demo',
        password: 'KurioDemo123!',
      }),
    })
    if (!login.ok) throw Error('Demo sign-in failed')
    const session: { accessToken: string } = await login.json()
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    }

    const wallet = await fetch('/api/wallets/primary', {
      method: 'PUT', headers,
      body: JSON.stringify({
        label: 'Principal', nickname: 'Teste',
        network: 'Ethereum', type: 'Software',
        address: `0x${'a'.repeat(40)}`, isPrimary: true,
      }),
    })
    const added = await fetch('/api/cart/items', {
      method: 'POST', headers,
      body: JSON.stringify({ nftId: '1', editionId: 'standard', quantity: 1 }),
    })
    if (!wallet.ok || !added.ok) throw Error('Could not prepare checkout')

    const oldResponse = await fetch('/api/quote?network=Ethereum', { headers })
    const original: { id: string; totalEth: string } = await oldResponse.json()
    if (!oldResponse.ok) throw Error('Initial quote failed')

    const updated = await fetch('/api/mock/nfts/1/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceEth: '1.72', available: 12 }),
    })
    if (!updated.ok) throw Error('Could not update NFT price')

    const newResponse = await fetch('/api/quote?network=Ethereum', { headers })
    const current: { id: string; totalEth: string } = await newResponse.json()
    if (!newResponse.ok) throw Error('Updated quote failed')

    const stalePurchase = await fetch('/api/orders', {
      method: 'POST', headers,
      body: JSON.stringify({
        idempotencyKey: crypto.randomUUID(),
        quoteId: original.id, walletId: 'primary',
        provider: 'Coinbase Wallet',
      }),
    })
    return {
      staleStatus: stalePurchase.status,
      oldTotal: original.totalEth,
      currentTotal: current.totalEth,
      quoteChanged: original.id !== current.id,
    }
  })

  expect(result.staleStatus).toBe(409)
  expect(result.quoteChanged).toBe(true)
  expect(result.oldTotal).not.toBe(result.currentTotal)
})
