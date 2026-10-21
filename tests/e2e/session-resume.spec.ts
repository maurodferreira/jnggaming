import { test, expect, type Page } from '@playwright/test'

async function resetDemo(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /SEJA DONO/i })).toBeVisible()
  const reset = await page.evaluate(async () => {
    const response = await fetch('/api/mock/reset-all', { method: 'POST' })
    return response.ok
  })
  expect(reset).toBe(true)
}

test('expired checkout session returns to login and preserves coupon and cart', async ({ page }) => {
  test.setTimeout(60_000)
  await resetDemo(page)
  await page.goto('/login')
  await page.getByLabel('E-mail').fill('colecionador@kurio.demo')
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\?q=/)

  await page.goto('/nft/1')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('NFT adicionado ao carrinho!')).toBeVisible()
  await page.getByRole('link', { name: /Ver meu carrinho/i }).click()
  await page.getByLabel('Código promocional').fill('KURIO10')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.locator('dl[aria-label="Valores estimados do pedido"]')).toContainText('1.087 ETH')
  await page.getByRole('link', { name: /Conectar e finalizar/i }).click()
  await expect(page).toHaveURL(/\/checkout\?coupon=KURIO10/)

  const responseStatus = await page.evaluate(async () => {
    const response = await fetch('/api/mock/expire-session', { method: 'POST' })
    return response.status
  })
  expect(responseStatus).toBe(200)
  await page.reload()
  await expect(page).toHaveURL(/\/login\?/, { timeout: 15_000 })
  expect(new URL(page.url()).searchParams.get('next')).toBe('/checkout')
  expect(new URL(page.url()).searchParams.get('coupon')).toBe('KURIO10')

  await page.getByLabel('E-mail').fill('colecionador@kurio.demo')
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/checkout\?coupon=KURIO10/)
  await expect(page.locator('#promo-code')).toHaveValue('KURIO10')
  await expect(page.locator('section[aria-label="Cupom e resumo"]')).toContainText('1.087 ETH')
})
