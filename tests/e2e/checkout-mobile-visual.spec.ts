import { expect, test, type Page } from '@playwright/test'

const tokenKey = 'kurio:demo:access-token:v1'

async function prepareCheckout(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /SEJA DONO/i })).toBeVisible()
  const reset = await page.evaluate(async () => (
    await fetch('/api/mock/reset-all', { method: 'POST' })
  ).ok)
  expect(reset).toBe(true)

  await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill('colecionador@kurio.demo')
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\?q=/)

  const prepared = await page.evaluate(async key => {
    const token = localStorage.getItem(key)
    if (!token) return false
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    const [wallet, item] = await Promise.all([
      fetch('/api/wallets/primary', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          label: 'Principal', nickname: 'Minha coleção', network: 'Ethereum',
          type: 'Software', address: '0x' + 'a'.repeat(40), isPrimary: true,
        }),
      }),
      fetch('/api/cart/items', {
        method: 'POST',
        headers,
        body: JSON.stringify({ nftId: '1', editionId: 'standard', quantity: 1 }),
      }),
    ])
    return wallet.ok && item.ok
  }, tokenKey)
  expect(prepared).toBe(true)
  await page.goto('/checkout')
  await expect(page.getByRole('button', { name: 'Confirmar compra simulada' })).toBeEnabled()
}

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium',
    'Consistent viewport-based visual checks run on desktop Chromium.')
  await prepareCheckout(page)
})

test('checkout: items, live quote and CTA stay usable on narrow screens', async ({ page }, testInfo) => {
  test.setTimeout(100_000)
  for (const width of [320, 390, 414, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })

    const sidewaysOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(sidewaysOverflow, `No horizontal overflow at ${width}px`).toBeLessThanOrEqual(1)

    const action = page.getByRole('button', { name: 'Confirmar compra simulada' })
    await expect(action).toBeVisible()
    await expect(action).toBeEnabled()

    if (width < 640) {
      await expect(page.getByRole('region', { name: 'NFTs do pedido' })).toContainText('Emerald Ape #042')
      await expect(page.getByRole('region', { name: 'NFTs do pedido' })).toContainText('Edição:')
      await expect(page.locator('.kurio-checkout-action-total')).toBeVisible()
      const nav = page.getByRole('navigation', { name: 'Navegação mobile' })
      await expect(nav).toBeVisible()

      const overlap = await page.evaluate(() => {
        const button = document.querySelector<HTMLButtonElement>('.kurio-checkout-action button[type="submit"]')
        const navBar = document.querySelector<HTMLElement>('nav[aria-label="Navegação mobile"]')
        if (!button || !navBar) return null
        const btn = button.getBoundingClientRect()
        const navRect = navBar.getBoundingClientRect()
        return { overlapsNav: btn.bottom > navRect.top + 1, clipped: btn.left < -1 || btn.right > innerWidth + 1 }
      })
      expect(overlap).not.toBeNull()
      expect(overlap?.overlapsNav).toBe(false)
      expect(overlap?.clipped).toBe(false)
    } else {
      await expect(page.getByRole('region', { name: 'NFTs do pedido' })).toBeHidden()
      await expect(page.locator('.kurio-checkout-action-total')).toBeHidden()
    }

    await page.screenshot({
      path: testInfo.outputPath(`checkout-review-${width}.png`),
      fullPage: true,
      animations: 'disabled',
    })
  }
})

test('checkout: switching simulated provider, applying coupon, and confirming still work', async ({ page }) => {
  test.setTimeout(45_000)
  await page.setViewportSize({ width: 390, height: 900 })

  const metaMask = page.getByRole('radio', { name: 'MetaMask' })
  await metaMask.check()
  await expect(metaMask).toBeChecked()

  await page.getByLabel('Código promocional').fill('KURIO10')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByRole('region', { name: 'Cupom e resumo' }).getByText('Desconto')).toBeVisible()

  const summaryTotal = page.getByRole('region', { name: 'Cupom e resumo' })
    .locator('dl > div').last().locator('dd')
  await expect(summaryTotal).toContainText('ETH')
  await expect(page.locator('.kurio-checkout-action-total strong'))
    .toHaveText((await summaryTotal.textContent())?.trim() ?? '')

  await page.getByRole('button', { name: 'Confirmar compra simulada' }).click()
  await expect(page).toHaveURL(/\/orders\/[^/]+$/)
  await expect(page.getByRole('heading', { name: 'Pedido confirmado na demonstração!' })).toBeVisible()
  await expect(page.getByText('Nenhum NFT foi transferido')).toBeVisible()
})

test('checkout: motion respects reduced-motion preference', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const duration = await page.getByRole('region', { name: 'Escolha da carteira' }).evaluate(node =>
    getComputedStyle(node).animationDuration)
  expect(duration.split(',').every(part => Number.parseFloat(part) <= 0.01)).toBe(true)
})
