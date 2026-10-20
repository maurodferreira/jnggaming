import { expect, test } from '@playwright/test'

test('all original NFT artworks have usable high-quality WebP copies', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /SEJA DONO/i })).toBeVisible()

  const names = ['emerald-ape', 'sage-nomad', 'neon-vessel', 'golden-beat']
  const measurements = await page.evaluate(async artworks => {
    return Promise.all(artworks.map(async name => {
      const path = `/assets/nfts/${name}.webp`
      const response = await fetch(path)
      if (!response.ok || !response.headers.get('content-type')?.includes('image/webp')) {
        return { name, decoded: false, byteLength: 0 }
      }
      const bytes = await response.arrayBuffer()
      const artwork = new Image()
      artwork.src = path
      try {
        await artwork.decode()
      } catch {
        return { name, decoded: false, byteLength: bytes.byteLength }
      }
      return {
        name,
        decoded: artwork.naturalWidth > 0 && artwork.naturalHeight > 0,
        byteLength: bytes.byteLength,
      }
    }))
  }, names)

  for (const artwork of measurements) {
    expect(artwork.decoded, `Missing or damaged WebP artwork: ${artwork.name}`).toBe(true)
    expect(artwork.byteLength, `Unexpected WebP transfer size: ${artwork.name}`).toBeGreaterThan(0)
    expect(artwork.byteLength).toBeLessThan(500_000)
  }
})

test('hero artwork and NFT details render the correct optimized image', async ({ page }) => {
  await page.goto('/')
  const hero = page.getByRole('img', { name: /Emerald Ape, macaco/i })
  await expect(hero).toBeVisible()
  await expect(hero).toHaveAttribute('src', '/assets/nfts/emerald-ape.webp')
  await expect.poll(() => hero.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0)

  await page.goto('/nft/1')
  const detail = page.getByRole('img', { name: 'Emerald Ape #042, arte completa' })
  await expect(detail).toBeVisible()
  await expect(detail).toHaveAttribute('src', '/assets/nfts/emerald-ape.webp')
  await expect.poll(() => detail.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0)
})
