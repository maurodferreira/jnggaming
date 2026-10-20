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

test('catalog thumbnails are compact WebP copies of the original Figma artwork', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: /Ver detalhes de Emerald Ape #042/i })).toBeVisible()

  const names = ['emerald-ape', 'sage-nomad', 'neon-vessel', 'golden-beat']
  const images = await page.evaluate(async items => {
    return Promise.all(items.map(async name => {
      const source = `/assets/nfts/thumbs/${name}.webp`
      const response = await fetch(source)
      if (!response.ok) return { name, status: response.status, length: 0, width: 0 }
      const blob = await response.blob()
      const image = new Image()
      image.src = URL.createObjectURL(blob)
      try {
        await image.decode()
        return { name, status: response.status, length: blob.size, width: image.naturalWidth }
      } finally {
        URL.revokeObjectURL(image.src)
      }
    }))
  }, names)

  for (const image of images) {
    expect(image.status, image.name).toBe(200)
    expect(image.width, image.name).toBe(400)
    expect(image.length, image.name).toBeGreaterThan(0)
    expect(image.length, image.name).toBeLessThan(25_000)
  }

  const card = page.getByRole('link', { name: /Ver detalhes de Emerald Ape #042/i })
  await expect(card.locator('img')).toHaveAttribute('src', '/assets/nfts/thumbs/emerald-ape.webp')
  await expect(card.locator('img')).toHaveAttribute('srcset', /emerald-ape\.webp 960w/)
})

test('hero artwork and NFT details render the correct optimized image', async ({ page }) => {
  await page.goto('/')
  const hero = page.getByRole('img', { name: /Emerald Ape, macaco/i })
  await expect(hero).toBeVisible()
  await expect(hero).toHaveAttribute('src', '/assets/nfts/emerald-ape.webp')
  await expect.poll(() => hero.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0)

  await page.goto('/nft/1')
  const detail = page.getByRole('region', { name: 'Galeria de Emerald Ape #042' }).locator('[aria-live="polite"] img')
  await expect(detail).toBeVisible()
  await expect(detail).toHaveAttribute('src', '/assets/nfts/emerald-ape.webp')
  await expect.poll(() => detail.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0)
})
