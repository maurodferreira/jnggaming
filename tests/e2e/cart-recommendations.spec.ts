import { test, expect } from '@playwright/test'

test('cart recommendations render without a favorites context crash', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', error => pageErrors.push(error.message))

  await page.goto('/cart')
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()

  const recommendations = page.getByRole('region', { name: 'Colecionadores também viram' })
  await expect(recommendations.getByRole('link', { name: /Ver detalhes de Emerald Ape #042/i }))
    .toBeVisible()
  await expect(recommendations.getByRole('button', { name: 'Adicionar aos favoritos' }).first())
    .toBeVisible()
  expect(pageErrors).toEqual([])

  await page.goto('/nft/1')
  await expect(page.getByRole('button', { name: 'Adicionar ao carrinho' })).toBeEnabled()
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('NFT adicionado ao carrinho!')).toBeVisible()

  await page.goto('/cart')
  await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Itens do carrinho' })
    .getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Colecionadores também viram' })
    .getByRole('button', { name: 'Adicionar aos favoritos' }).first()).toBeVisible()
  expect(pageErrors).toEqual([])
})
