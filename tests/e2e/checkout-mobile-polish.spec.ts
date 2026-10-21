import { expect, test, type Page } from '@playwright/test'

async function prepareCheckout(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /SEJA DONO/i })).toBeVisible()
  const reset = await page.evaluate(async () => (await fetch('/api/mock/reset-all', { method: 'POST' })).ok)
  expect(reset).toBe(true)
  await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill('colecionador@kurio.demo')
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\?q=/)
  await page.goto('/checkout')
}

for (const width of [320, 390, 414, 768]) {
  test(`checkout mobile at ${width}px keeps actions visible without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await prepareCheckout(page)
    await expect(page.getByRole('heading', { name: 'Pagamento com carteira' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Carteira conectada' })).toBeVisible()
    await expect(page.getByRole('group', { name: /Carteira e rede · Provedor simulado/ })).toBeVisible()
    await expect(page.getByLabel('Código promocional')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Confirmar compra simulada' })).toBeDisabled()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })
}

test('mobile checkout keeps accessible provider selection and coupon controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await prepareCheckout(page)
  const walletConnect = page.getByRole('radio', { name: 'WalletConnect' })
  await walletConnect.check()
  await expect(walletConnect).toBeChecked()
  await page.getByLabel('Código promocional').fill('KURIO10')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByRole('button', { name: 'Remover cupom' })).toBeVisible()
  await page.getByRole('button', { name: 'Remover cupom' }).click()
  await expect(page.getByRole('button', { name: 'Remover cupom' })).toHaveCount(0)
})

test('reduced motion keeps checkout usable without animations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
  await prepareCheckout(page)
  const section = page.getByRole('region', { name: 'Escolha da carteira' })
  await expect(section).toBeVisible()
  await expect(section).toHaveCSS('animation-duration', '1e-05s')
  await expect(page.getByRole('button', { name: 'Confirmar compra simulada' })).toBeDisabled()
})
