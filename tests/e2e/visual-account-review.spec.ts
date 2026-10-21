import { expect, test, type Page } from '@playwright/test'

async function noSidewaysScroll(page: Page) {
  const excess = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  )
  expect(excess, 'Content should remain inside the viewport').toBeLessThanOrEqual(1)
}

test('capture login at mobile and desktop widths', async ({ page }, testInfo) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/login')
    await expect(page.getByLabel('E-mail', { exact: true })).toBeVisible()
    await noSidewaysScroll(page)
    await page.screenshot({
      path: testInfo.outputPath(`login-${width}px.png`),
      fullPage: true,
      animations: 'disabled',
    })
  }
})

test('capture wallet and checkout layouts without changing purchase behavior', async ({ page }, testInfo) => {
  test.setTimeout(45_000)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /SEJA DONO/i })).toBeVisible()
  const resetOk = await page.evaluate(async () => (
    await fetch('/api/mock/reset-all', { method: 'POST' })
  ).ok)
  expect(resetOk).toBe(true)

  await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill('colecionador@kurio.demo')
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\?q=/)

  await page.goto('/wallets')
  await page.locator('#wallet-true-nickname').fill('Minha coleção')
  await page.locator('#wallet-true-address').fill(`0x${'a'.repeat(40)}`)
  await page.getByRole('button', { name: 'Salvar carteira' }).first().click()
  await expect(page.getByRole('status')).toContainText('Carteira salva com sucesso.')

  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await noSidewaysScroll(page)
    await page.screenshot({
      path: testInfo.outputPath(`wallets-${width}px.png`),
      fullPage: true,
      animations: 'disabled',
    })
  }

  await page.goto('/nft/1')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('NFT adicionado ao carrinho!')).toBeVisible()
  await page.goto('/checkout')
  await expect(page.getByRole('heading', { name: 'Pagamento com carteira' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirmar compra simulada' })).toBeEnabled()

  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await noSidewaysScroll(page)
    await page.screenshot({
      path: testInfo.outputPath(`checkout-${width}px.png`),
      fullPage: true,
      animations: 'disabled',
    })
  }
})
