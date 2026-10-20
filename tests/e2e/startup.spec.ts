import { expect, test } from '@playwright/test'

test('cold start keeps every demo REST response inside MSW while React renders', async ({ page }) => {
  const apiResponses: Array<{ path: string; status: number }> = []
  page.on('response', response => {
    const path = new URL(response.url()).pathname
    if (path.startsWith('/api/')) {
      apiResponses.push({ path, status: response.status() })
    }
  })

  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: /SEJA DONO/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /Ver detalhes de Emerald Ape #042/i }))
    .toBeVisible({ timeout: 25_000 })

  expect(apiResponses.some(response => response.path === '/api/nfts' && response.status === 200))
    .toBe(true)
  expect(apiResponses.some(response => response.status >= 400), JSON.stringify(apiResponses))
    .toBe(false)

  const registeredWorker = await page.evaluate(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations()
    return registrations.some(registration =>
      registration.active?.scriptURL.endsWith('/mockServiceWorker.js'))
  })
  expect(registeredWorker).toBe(true)
})
