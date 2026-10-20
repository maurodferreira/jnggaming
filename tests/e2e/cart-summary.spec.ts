import { expect, test, type Page } from '@playwright/test'

async function resetDemo(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /SEJA DONO/i })).toBeVisible()
  const reset = await page.evaluate(async () => {
    const response = await fetch('/api/mock/reset-all', { method: 'POST' })
    return response.ok
  })
  expect(reset).toBe(true)
  await page.reload()
}

test.beforeEach(async ({ page }) => {
  await resetDemo(page)
})

test('cart coupon preview uses the same API bigint amounts as checkout', async ({ page }) => {
  test.setTimeout(35_000)
  await page.goto('/nft/1')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('NFT adicionado ao carrinho!')).toBeVisible()
  await page.getByRole('link', { name: /Ver meu carrinho/i }).click()
  await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible()

  const summary = page.locator('dl[aria-label="Valores estimados do pedido"]')
  await expect(summary).toContainText('1.19 ETH')
  await expect(summary).toContainText('0.016 ETH')
  await expect(summary).toContainText('1.206 ETH')

  await page.getByLabel('Código promocional').fill('KURIO10')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(summary).toContainText('0.119 ETH')
  await expect(summary).toContainText('1.087 ETH')

  await page.getByLabel('Código promocional').fill('INVALIDO')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByRole('alert')).toContainText('Cupom inválido')

  await page.getByRole('button', { name: /Remover cupom INVALIDO/ }).click()
  await expect(summary).toContainText('1.206 ETH')
})

test('an applied cart coupon is carried to the authenticated quote', async ({ page }) => {
  test.setTimeout(35_000)
  await page.goto('/login')
  await page.getByLabel('E-mail').fill('colecionador@kurio.demo')
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\?q=/)

  await page.goto('/nft/1')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('NFT adicionado ao carrinho!')).toBeVisible()
  await page.getByRole('link', { name: /Ver meu carrinho/i }).click()
  await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible()
  await page.getByLabel('Código promocional').fill('kurio10')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.locator('dl[aria-label="Valores estimados do pedido"]')).toContainText('1.087 ETH')
  await page.getByRole('link', { name: /Conectar e finalizar/i }).click()
  await expect(page).toHaveURL(/\/checkout\?coupon=KURIO10/)
  await expect(page.locator('#promo-code')).toHaveValue('KURIO10')
  await expect(page.locator('section[aria-label="Cupom e resumo"]')).toContainText('1.087 ETH')
})
