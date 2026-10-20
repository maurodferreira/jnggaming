import { expect, test, type Page } from '@playwright/test'

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => {
    const documentWidth = document.documentElement.scrollWidth
    const viewportWidth = document.documentElement.clientWidth
    return documentWidth - viewportWidth
  })
  expect(overflow, 'The page must not scroll horizontally at the inspected width').toBeLessThanOrEqual(1)
}

// Full-page screenshots must show finished content, not the initial loading
// skeleton. Trigger and decode only the images belonging to the visible page.
async function waitForVisualContent(page: Page, screen: string) {
  if (screen === 'catalog') {
    await expect(page.getByRole('link', { name: /Ver detalhes de Emerald Ape #042/i })).toBeVisible()
  } else if (screen === 'nft-detail') {
    await expect(page.getByRole('heading', { name: 'Emerald Ape #042', level: 1 })).toBeVisible()
  } else {
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
  }

  const loaded = await page.evaluate(async () => {
    await document.fonts.ready
    const images = Array.from(document.querySelectorAll<HTMLImageElement>('main img'))
    await Promise.all(images.map(async image => {
      // Lazy images further down the full-page capture should be decoded too.
      image.loading = 'eager'
      try {
        await image.decode()
      } catch {
        // Failed artwork is asserted below, not silently accepted.
      }
    }))
    return images.every(image => image.complete && image.naturalWidth > 0)
  })
  expect(loaded, 'All main content artwork must decode before visual capture').toBe(true)
}

for (const width of [390, 768, 1440]) {
  test(`captures the main screens at ${width}px without horizontal overflow`, async ({ page }, testInfo) => {
    test.setTimeout(60_000)
    await page.setViewportSize({ width, height: 900 })

    const screens = [
      { url: '/', name: 'catalog', heading: /SEJA DONO/i },
      { url: '/nft/1', name: 'nft-detail', heading: /Emerald Ape #042/i },
      { url: '/cart', name: 'cart', heading: /Carrinho de NFTs/i },
    ] as const

    for (const screen of screens) {
      await page.goto(screen.url)
      await expect(page.getByRole('heading', { name: screen.heading }).first()).toBeVisible()
      await waitForVisualContent(page, screen.name)
      await expectNoHorizontalScroll(page)
      await page.screenshot({
        path: testInfo.outputPath(`${screen.name}-${width}px.png`),
        fullPage: true,
        animations: 'disabled',
      })
    }
  })
}

test('keyboard users can skip navigation and see clear focus', async ({ page }) => {
  await page.goto('/')
  const skip = page.getByRole('link', { name: 'Pular para o conteúdo principal' })
  // TanStack Router can restore focus during the initial client render.
  // Start from a known keyboard position, then check forward/backward Tab.
  await expect(page.getByRole('heading', { name: /SEJA DONO/i })).toBeVisible()
  await skip.focus()
  await expect(skip).toBeFocused()
  await expect(skip).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(skip).not.toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(skip).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()
})

test('reduced motion avoids smooth scrolling and long animations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /SEJA DONO/i })).toBeVisible()
  const behavior = await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)
  expect(behavior).toBe('auto')
})
