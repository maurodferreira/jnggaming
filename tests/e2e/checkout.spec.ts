import { expect, test, type Page } from '@playwright/test'

async function resetScenario(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /SEJA DONO/i })).toBeVisible()
  const reset = await page.evaluate(async () => (
    await fetch('/api/mock/reset-all', { method: 'POST' })
  ).ok)
  expect(reset).toBe(true)
  await page.reload()
}

async function signIn(page: Page) {
  await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill('colecionador@kurio.demo')
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\?q=/)
}

test.beforeEach(async ({ page }) => resetScenario(page))

test('checkout sem carteira impede confirmar pedido', async ({ page }) => {
  await signIn(page)
  await page.goto('/nft/1')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('NFT adicionado ao carrinho!')).toBeVisible()
  await page.goto('/checkout')
  await expect(page.getByRole('heading', { name: 'Pagamento com carteira' })).toBeVisible()
  await expect(page.getByText('Você precisa cadastrar uma carteira fictícia')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirmar compra simulada' })).toBeDisabled()
  await page.getByRole('link', { name: 'Cadastrar carteira' }).click()
  await expect(page).toHaveURL(/\/wallets$/)
})

test('compra simulada só confirma após status do pedido e resiste a refresh', async ({ page }) => {
  test.setTimeout(45_000)
  await signIn(page)

  await page.goto('/wallets')
  await expect(page.getByRole('heading', { name: 'Carteira principal' })).toBeVisible()
  await page.locator('#wallet-true-label').fill('Principal')
  await page.locator('#wallet-true-nickname').fill('Minha coleção')
  await page.locator('#wallet-true-address').fill('0x' + 'a'.repeat(40))
  await page.getByRole('button', { name: 'Salvar carteira' }).first().click()
  await expect(page.getByRole('status')).toContainText('Carteira salva com sucesso.')

  await page.goto('/nft/1')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('NFT adicionado ao carrinho!')).toBeVisible()
  await page.goto('/cart')
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()

  await expect(page.getByRole('heading', { name: 'Pagamento com carteira' })).toBeVisible()
  await expect(page.getByText('Minha coleção')).toBeVisible()

  await page.getByLabel('Código promocional').fill('KURIO10')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByRole('button', { name: 'Confirmar compra simulada' })).toBeEnabled()
  await page.getByRole('button', { name: 'Confirmar compra simulada' }).click()

  await expect(page).toHaveURL(/\/orders\/[^/]+$/)
  await expect(page.getByRole('heading', { name: 'Pedido confirmado na demonstração!' })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Nenhum NFT foi transferido')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Pedido confirmado na demonstração!' })).toBeVisible()
  await page.goto('/cart')
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
})


test('carteira cadastrada não permite compra com carrinho vazio', async ({ page }) => {
  await signIn(page)
  await page.goto('/wallets')
  await expect(page.getByRole('heading', { name: 'Carteira principal' })).toBeVisible()
  await page.locator('#wallet-true-label').fill('Principal')
  await page.locator('#wallet-true-nickname').fill('Minha coleção')
  await page.locator('#wallet-true-address').fill('0x' + 'a'.repeat(40))
  await page.getByRole('button', { name: 'Salvar carteira' }).first().click()
  await expect(page.getByRole('status')).toContainText('Carteira salva com sucesso.')

  await page.goto('/cart')
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
  await page.goto('/checkout')
  await expect(page.getByRole('heading', { name: 'Pagamento com carteira' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirmar compra simulada' })).toBeDisabled()
})
