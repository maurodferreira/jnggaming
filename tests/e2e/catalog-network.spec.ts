import { expect, test, type Page } from '@playwright/test'

async function configure(page: Page, scenario: string) {
  const status = await page.evaluate(async profile => {
    const response = await fetch('/api/mock/catalog-network', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: profile }),
    })
    return response.status
  }, scenario)
  expect(status).toBe(200)
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /SEJA DONO/i })).toBeVisible()
  const reset = await page.evaluate(async () => {
    const response = await fetch('/api/mock/reset-all', { method: 'POST' })
    return response.ok
  })
  expect(reset).toBe(true)
})

test('slow network shows shimmer skeleton and API 503 recovers on retry', async ({ page }) => {
  test.setTimeout(40_000)
  await configure(page, 'slow')
  await page.reload()
  await expect(page.locator('[aria-label="Carregando NFTs"]')).toBeVisible()
  await expect(page.getByRole('link', { name: /Emerald Ape #042/ })).toBeVisible({ timeout: 20_000 })

  await configure(page, 'http-500')
  await page.reload()
  const alert = page.getByRole('alert')
  await expect(alert).toContainText('Não foi possível carregar os NFTs.', { timeout: 15_000 })

  await configure(page, 'normal')
  await alert.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByRole('link', { name: /Emerald Ape #042/ })).toBeVisible()
})

test('offline NFT details recover via REST without inventing content', async ({ page }) => {
  test.setTimeout(35_000)
  await configure(page, 'offline')
  await page.goto('/nft/1')
  await expect(page.getByRole('heading', { name: 'Não foi possível carregar o NFT' })).toBeVisible({ timeout: 15_000 })
  await configure(page, 'normal')
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042', level: 1 })).toBeVisible()
})
