import { expect, test } from '@playwright/test'

test('preloads the main artwork on the home and first NFT entry routes', async ({ page }) => {
  const hint = page.locator('head link[rel="preload"][as="image"][href="/assets/nfts/emerald-ape.webp"]')

  await page.goto('/')
  await expect(hint).toHaveCount(1)
  await expect(hint).toHaveAttribute('fetchpriority', 'high')

  await page.goto('/nft/1')
  await expect(hint).toHaveCount(1)

  await page.goto('/login')
  await expect(hint).toHaveCount(0)

  await page.goto('/nft/2')
  await expect(hint).toHaveCount(0)
})
