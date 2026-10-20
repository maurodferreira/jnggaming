import { expect, test } from '@playwright/test'

test('progressive first paint is removed as soon as the Home route renders', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))

  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('html')).toHaveAttribute('data-kurio-shell', 'home')
  await expect(page.getByRole('heading', { name: /SEJA DONO/i })).toBeVisible()
  await expect(page.locator('#kurio-first-paint')).toBeHidden()
  await expect(page.locator('#kurio-first-paint .kurio-first-card img')).toHaveCount(2)
  await expect(page.locator('#kurio-first-paint .kurio-first-nft')).toHaveCount(0)
  await expect(page.getByRole('link', { name: /Ver detalhes de Emerald Ape #042/i })).toBeVisible()
  expect(errors).toEqual([])
})

test('direct NFT entry removes first paint without obscuring the gallery', async ({ page }) => {
  await page.goto('/nft/1', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('html')).toHaveAttribute('data-kurio-shell', 'nft')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042', level: 1 })).toBeVisible()
  await expect(page.locator('#kurio-first-paint')).toBeHidden()
  await expect(page.locator('#kurio-first-paint .kurio-first-nft')).toHaveCount(1)
  await expect(page.locator('#kurio-first-paint .kurio-first-home')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Adicionar ao carrinho' })).toBeEnabled()
})

test('non-catalog routes never display the progressive artwork placeholder', async ({ page }) => {
  await page.goto('/cart', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('html')).toHaveAttribute('data-kurio-shell', 'none')
  await expect(page.locator('#kurio-first-paint')).toBeHidden()
  await expect(page.locator('#kurio-first-paint img')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
})
