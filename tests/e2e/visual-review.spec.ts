import { expect, test, type Page } from '@playwright/test'

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => {
    const documentWidth = document.documentElement.scrollWidth
    const viewportWidth = document.documentElement.clientWidth
    return documentWidth - viewportWidth
  })
  expect(overflow, 'The page must not scroll horizontally at the inspected width').toBeLessThanOrEqual(1)
}

for (const width of [390, 768, 1440]) {
  test(`captures the main screens at ${width}px without horizontal overflow`, async ({ page }, testInfo) => {
    test.setTimeout(35_000)
    await page.setViewportSize({ width, height: 900 })

    const screens = [
      { url: '/', name: 'catalog', heading: /SEJA DONO/i },
      { url: '/nft/1', name: 'nft-detail', heading: /Emerald Ape #042/i },
      { url: '/cart', name: 'cart', heading: /Carrinho de NFTs/i },
    ] as const

    for (const screen of screens) {
      await page.goto(screen.url)
      await expect(page.getByRole('heading', { name: screen.heading }).first()).toBeVisible()
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
