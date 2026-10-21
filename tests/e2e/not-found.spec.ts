import { expect, test } from '@playwright/test'

test('unknown deep links show a useful 404 and return to the catalog', async ({ page }) => {
  await page.goto('/pagina-que-nao-existe')
  await expect(page.getByRole('heading', { name: 'Esta página não foi encontrada' })).toBeVisible()
  await expect(page.getByText('ERRO 404')).toBeVisible()
  await page.getByRole('link', { name: 'Voltar ao catálogo' }).click()
  await expect(page).toHaveURL(/\/?\?/)
  await expect(page.getByRole('heading', { name: /SEJA DONO/i })).toBeVisible()
})

test('unknown URLs remain readable on mobile without sideways scrolling', async ({ page }) => {
  await page.goto('/nao-existe')
  await expect(page.getByRole('heading', { name: 'Esta página não foi encontrada' })).toBeVisible()
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
})
