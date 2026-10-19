import { expect, test, type Page } from '@playwright/test'

async function openWalletForm(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /SEJA DONO/i })).toBeVisible()
  const reset = await page.evaluate(async () => (
    await fetch('/api/mock/reset-all', { method: 'POST' })
  ).ok)
  expect(reset).toBe(true)

  await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill('colecionador@kurio.demo')
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\?q=/)
  await page.goto('/wallets')
  await expect(page.getByRole('heading', { name: 'Carteira principal' })).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await openWalletForm(page)
})

test('menu de rede usa tema escuro, foco acessível e navegação por teclado', async ({ page }) => {
  const network = page.locator('#wallet-true-network')
  await network.focus()
  await network.press('Enter')

  const menu = page.locator('[data-slot="select-content"]')
  await expect(menu).toBeVisible()
  await expect(menu).toHaveCSS('background-color', 'rgb(36, 22, 18)')
  await expect(page.getByRole('option', { name: 'Ethereum' })).toBeVisible()
  await expect(page.getByRole('option', { name: 'Polygon' })).toBeVisible()
  await expect(page.getByRole('option', { name: 'Solana' })).toBeVisible()

  await page.getByRole('option', { name: 'Polygon' }).click()
  await expect(network).toContainText('Polygon')

  await network.press('Enter')
  await page.keyboard.press('Escape')
  await expect(menu).not.toBeVisible()
  await expect(network).toBeFocused()
})

test('trocar rede limpa endereço incompatível e tipo escolhido persiste', async ({ page }) => {
  const network = page.locator('#wallet-true-network')
  const type = page.locator('#wallet-true-type')
  const address = page.locator('#wallet-true-address')

  await page.locator('#wallet-true-nickname').fill('Principal')
  await address.fill('0x' + 'a'.repeat(40))

  await network.click()
  await page.getByRole('option', { name: 'Polygon' }).click()
  await expect(address).toHaveValue('')
  await address.fill('0x' + 'b'.repeat(40))

  await type.click()
  await page.getByRole('option', { name: 'Hardware' }).click()
  await expect(type).toContainText('Hardware')

  await page.getByRole('button', { name: 'Salvar carteira' }).first().click()
  await expect(page.getByRole('status')).toContainText('Carteira salva com sucesso.')

  await page.reload()
  await expect(page.locator('#wallet-true-network')).toContainText('Polygon')
  await expect(page.locator('#wallet-true-type')).toContainText('Hardware')
  await expect(page.locator('#wallet-true-address')).toHaveValue('0x' + 'b'.repeat(40))
})
