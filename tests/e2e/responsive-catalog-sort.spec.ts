import { expect, test } from '@playwright/test'

test('mobile catalog does not download the desktop-only select', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const desktopSelectRequests: string[] = []
  page.on('request', request => {
    if (request.url().includes('DesktopCatalogSort')) {
      desktopSelectRequests.push(request.url())
    }
  })

  await page.goto('/')
  await expect(page.getByRole('heading', { name: /SEJA DONO/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /Ver detalhes de Emerald Ape #042/i })).toBeVisible()
  await expect(page.locator('[data-slot="select-trigger"]')).toHaveCount(0)
  expect(desktopSelectRequests).toEqual([])
})

test('wide catalog loads the original desktop select and preserves URL filters', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /SEJA DONO/i })).toBeVisible()

  const sort = page.locator('[data-slot="select-trigger"]')
  await expect(sort).toBeVisible()
  await sort.click()
  await page.getByRole('option', { name: 'Maior preço' }).click()
  await expect(page).toHaveURL(/sort=price_desc/)
  await page.reload()
  await expect(page.locator('[data-slot="select-trigger"]')).toContainText('Maior preço')
})
