import { expect, test } from '@playwright/test'

// The Figma mobile detail has its own purchase area. Keep the existing
// navigation reachable while checking stock and cart behavior through MSW.
for (const width of [390, 414]) {
  test(`NFT purchase tray is usable above navigation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/nft/1')

    const tray = page.getByRole('region', { name: 'Compra demonstrativa do NFT' })
    const navigation = page.getByRole('navigation', { name: 'Navegação mobile' })
    const add = tray.getByRole('button', { name: 'Adicionar ao carrinho' })

    await expect(tray).toBeVisible()
    await expect(navigation).toBeVisible()
    await expect(add).toBeEnabled()
    await expect(tray).toContainText('1.19 ETH')
    await expect(tray).toContainText('Compra simulada')

    const trayBox = await tray.boundingBox()
    const navBox = await navigation.boundingBox()
    expect(trayBox).not.toBeNull()
    expect(navBox).not.toBeNull()
    expect(trayBox!.y).toBeGreaterThan(0)
    expect(trayBox!.y + trayBox!.height).toBeLessThanOrEqual(navBox!.y + 1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width + 1)

    await tray.getByRole('button', { name: 'Aumentar quantidade' }).click()
    await expect(tray.getByRole('group', { name: 'Quantidade de NFTs' }).locator('output'))
      .toHaveText('2')
    await expect(tray).toContainText('2.38 ETH')

    await add.click()
    await expect(page.getByText('NFT adicionado ao carrinho!', { exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Ver meu carrinho' }).click()
    await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Itens do carrinho' })).toContainText('2')
  })
}

test('tablet and desktop keep the original purchase controls', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 })
  await page.goto('/nft/1')

  await expect(page.getByRole('region', { name: 'Compra demonstrativa do NFT' })).toBeHidden()
  await expect(page.getByRole('button', { name: 'Adicionar ao carrinho' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042', level: 1 })).toBeVisible()
})

test('mobile edition changes update the tray price before adding to cart', async ({ page }) => {
  test.setTimeout(30_000)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/nft/1')

  const tray = page.getByRole('region', { name: 'Compra demonstrativa do NFT' })
  // The radio is visually hidden inside the Figma-style chip; click the label.
  await page.getByText('Collector', { exact: true }).click()
  await expect(page.getByRole('radio', { name: /Collector/i })).toBeChecked()
  await expect(tray).toContainText('1.24 ETH')
  await expect(tray.getByRole('group', { name: 'Quantidade de NFTs' }).locator('output'))
    .toHaveText('1')
  await tray.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('NFT adicionado ao carrinho!', { exact: true })).toBeVisible()
})
