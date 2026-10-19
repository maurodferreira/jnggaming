import { expect, test, type Page } from '@playwright/test'

const tokenKey = 'kurio:demo:access-token:v1'

async function prepareOrder(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /SEJA DONO/i })).toBeVisible()
  await page.evaluate(async () => {
    await fetch('/api/mock/reset-all', { method: 'POST' })
  })
  await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill('colecionador@kurio.demo')
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\?q=/)

  await page.evaluate(async (key) => {
    const token = localStorage.getItem(key)
    if (!token) throw Error('No demo session token')
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    const wallet = await fetch('/api/wallets/primary', {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        label: 'Carteira principal', nickname: 'Teste E2E',
        network: 'Ethereum', type: 'Software',
        address: '0x' + 'a'.repeat(40), isPrimary: true,
      }),
    })
    const cart = await fetch('/api/cart/items', {
      method: 'POST',
      headers,
      body: JSON.stringify({ nftId: '1', editionId: 'standard', quantity: 1 }),
    })
    if (!wallet.ok || !cart.ok) throw Error('Demo setup failed')
  }, tokenKey)
}

test.beforeEach(async ({ page }) => prepareOrder(page))

test('cotação estável e dois identificadores não duplicam compra', async ({ page }) => {
  test.setTimeout(30_000)
  const result = await page.evaluate(async key => {
    const token = localStorage.getItem(key)
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    const getQuote = async () => {
      const response = await fetch('/api/quote?network=Ethereum', { headers })
      return response.json()
    }
    const quote1 = await getQuote()
    const quote2 = await getQuote()
    const first = {
      idempotencyKey: crypto.randomUUID(), quoteId: quote1.id,
      walletId: 'primary', provider: 'Coinbase Wallet',
    }
    const post = (body: typeof first) => fetch('/api/orders', {
      method: 'POST', headers, body: JSON.stringify(body),
    })
    const created = await post(first)
    const sameKey = await post(first)
    const differentKey = await post({ ...first, idempotencyKey: crypto.randomUUID() })
    const createdBody = await created.json()
    const sameKeyBody = await sameKey.json()
    return {
      quoteStable: quote1.id === quote2.id,
      createdStatus: created.status,
      sameKeyStatus: sameKey.status,
      createdId: createdBody.id,
      sameKeyId: sameKeyBody.id,
      differentKeyStatus: differentKey.status,
    }
  }, tokenKey)
  expect(result.quoteStable).toBe(true)
  expect(result.createdStatus).toBe(201)
  expect(result.sameKeyStatus).toBe(200)
  expect(result.sameKeyId).toBe(result.createdId)
  expect(result.differentKeyStatus).toBe(409)
})

test('recusa simulada mantém os itens para tentar novamente', async ({ page }) => {
  test.setTimeout(35_000)
  await page.evaluate(async key => {
    const token = localStorage.getItem(key)
    const response = await fetch('/api/mock/next-order', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome: 'declined' }),
    })
    if (!response.ok) throw Error('Could not set decline scenario')
  }, tokenKey)

  await page.goto('/checkout')
  await expect(page.getByRole('button', { name: 'Confirmar compra simulada' })).toBeEnabled()
  await page.getByRole('button', { name: 'Confirmar compra simulada' }).click()
  await expect(page).toHaveURL(/\/orders\/[^/]+$/)
  await expect(page.getByRole('heading', { name: 'Pedido recusado na simulação' })).toBeVisible()
  await page.goto('/cart')
  await expect(page.getByRole('region', { name: 'Itens do carrinho' }).getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
})

test('resposta perdida recupera pedido existente sem nova cobrança', async ({ page }) => {
  test.setTimeout(35_000)
  await page.evaluate(async key => {
    const token = localStorage.getItem(key)
    const response = await fetch('/api/mock/next-order', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome: 'network-drop' }),
    })
    if (!response.ok) throw Error('Could not set simulated network drop')
  }, tokenKey)
  await page.goto('/checkout')
  await expect(page.getByRole('button', { name: 'Confirmar compra simulada' })).toBeEnabled()
  await page.getByRole('button', { name: 'Confirmar compra simulada' }).click()
  await expect(page).toHaveURL(/\/orders\/[^/]+$/)
  await expect(page.getByRole('heading', { name: 'Pedido confirmado na demonstração!' })).toBeVisible({ timeout: 15_000 })
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Pedido confirmado na demonstração!' })).toBeVisible()
})
