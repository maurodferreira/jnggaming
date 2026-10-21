import { expect, test, type Page } from '@playwright/test'

// Baselines: Figma catalog filters and interactive NFT gallery / metadata at 390, 768 and 1440 CSS px.
// Review responsive primary artwork and full-quality zoom without changing the Figma layout.
const widths = [390, 768, 1440] as const

async function resetDemo(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /SEJA DONO/i })).toBeVisible()
  const reset = await page.evaluate(async () => {
    const response = await fetch('/api/mock/reset-all', { method: 'POST' })
    return response.ok
  })
  expect(reset).toBe(true)
}

async function visuallyReady(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all(
      Array.from(document.querySelectorAll<HTMLImageElement>('img')).map(async image => {
        // Force lazy imagery to complete before full-page comparison.
        image.loading = 'eager'
        try {
          await image.decode()
        } catch {
          // Failed important images are asserted by the regular E2E suite.
        }
      }),
    )
  })
}

async function captureWidths(page: Page, name: string) {
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 })
    await visuallyReady(page)
    // Identificadores e data do pedido variam; só eles ficam mascarados.
    const volatileFields = name === 'order-confirmed'
      ? [
          page.getByText('ID simulado', { exact: true }).locator('..').locator('dd'),
          page.getByText('Data', { exact: true }).locator('..').locator('dd'),
        ]
      : []
    // The checkout phone layout is a draft redesign. Keep a full-size screenshot
    // in the test artifacts for human approval before versioning its new PNG baseline.
    // All other screens/breakpoints still compare against approved snapshots.
    if (name === 'checkout' && width === 390) {
      await page.screenshot({
        path: test.info().outputPath('checkout-390-candidate.png'),
        fullPage: true,
        animations: 'disabled',
        caret: 'hide',
      })
      continue
    }
    await expect(page).toHaveScreenshot(`${name}-${width}.png`, {
      fullPage: true,
      mask: volatileFields,
      maskColor: '#382117',
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.02,
      timeout: 15_000,
    })
  }
}

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium',
    'Visual baselines use Chromium at 390/768/1440 CSS px; device-specific mobile tests run separately.')
  await resetDemo(page)
})

test('visual baseline: home catalog', async ({ page }) => {
  test.setTimeout(90_000)
  await page.reload()
  await expect(page.getByRole('link', { name: /Ver detalhes de Emerald Ape #042/i })).toBeVisible()
  await captureWidths(page, 'home')
})

test('visual baseline: NFT detail', async ({ page }) => {
  test.setTimeout(90_000)
  await page.goto('/nft/1')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042', level: 1 })).toBeVisible()
  // Avoid photographing the transition from related-card placeholders to API data.
  await expect(page.getByRole('region', { name: 'Mais desta coleção' }).locator('article')).toHaveCount(5)
  await captureWidths(page, 'nft')
})

test('visual baseline: populated cart with API quote', async ({ page }) => {
  test.setTimeout(90_000)
  await page.goto('/nft/1')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('NFT adicionado ao carrinho!')).toBeVisible()
  await page.getByRole('link', { name: /Ver meu carrinho/i }).click()
  await expect(page.locator('dl[aria-label="Valores estimados do pedido"]')).toContainText('1.206 ETH')
  await captureWidths(page, 'cart-populated')
})

test('visual baseline: checkout with saved demo wallet', async ({ page }) => {
  test.setTimeout(110_000)
  await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill('colecionador@kurio.demo')
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\?q=/)
  await page.goto('/wallets')
  await page.locator('#wallet-true-label').fill('Principal')
  await page.locator('#wallet-true-nickname').fill('Minha coleção')
  await page.locator('#wallet-true-address').fill('0x' + 'a'.repeat(40))
  await page.getByRole('button', { name: 'Salvar carteira' }).first().click()
  await expect(page.getByRole('status')).toContainText('Carteira salva com sucesso.')

  await page.goto('/nft/1')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('NFT adicionado ao carrinho!')).toBeVisible()
  await page.goto('/checkout')
  await expect(page.getByRole('heading', { name: 'Pagamento com carteira' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirmar compra simulada' })).toBeEnabled()
  await captureWidths(page, 'checkout')
})


test('visual baseline: login and registration', async ({ page }) => {
  test.setTimeout(120_000)
  for (const path of ['/login', '/register'] as const) {
    await page.goto(path)
    await expect(page.getByLabel('E-mail', { exact: true })).toBeVisible()
    await captureWidths(page, path === '/login' ? 'login' : 'register')
  }
})

test('visual baseline: collector profile and wallets', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill('colecionador@kurio.demo')
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\?q=/)

  await page.goto('/profile')
  await expect(page.locator('#profile-display-name')).toBeVisible()
  await captureWidths(page, 'profile')

  await page.goto('/wallets')
  await expect(page.locator('#wallet-true-address')).toBeVisible()
  await captureWidths(page, 'wallets')
})

test('visual baseline: API-confirmed demo receipt', async ({ page }) => {
  test.setTimeout(150_000)
  await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill('colecionador@kurio.demo')
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\?q=/)

  await page.goto('/wallets')
  await page.locator('#wallet-true-label').fill('Principal')
  await page.locator('#wallet-true-nickname').fill('Minha coleção')
  await page.locator('#wallet-true-address').fill('0x' + 'a'.repeat(40))
  await page.getByRole('button', { name: 'Salvar carteira' }).first().click()
  await expect(page.getByRole('status')).toContainText('Carteira salva com sucesso.')

  await page.goto('/nft/1')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('NFT adicionado ao carrinho!')).toBeVisible()
  await page.goto('/checkout')
  await expect(page.getByRole('button', { name: 'Confirmar compra simulada' })).toBeEnabled()
  await page.getByRole('button', { name: 'Confirmar compra simulada' }).click()
  await expect(page).toHaveURL(/\/orders\/[^/]+$/)
  await expect(page.getByRole('heading', { name: 'Pedido confirmado na demonstração!' })).toBeVisible({ timeout: 20_000 })
  await captureWidths(page, 'order-confirmed')
})
