import { test, expect, type Page } from '@playwright/test'

async function resetDemo(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /SEJA DONO/i })).toBeVisible()
  const reset = await page.evaluate(async () => {
    const response = await fetch('/api/mock/reset-all', { method: 'POST' })
    return response.ok
  })
  expect(reset).toBe(true)
  await page.reload()
}

test.beforeEach(async ({ page }) => {
  await resetDemo(page)
})

test('catálogo suporta filtros, paginação e restauração da URL', async ({ page }) => {
  await expect(page.getByRole('link', { name: /Emerald Ape #042/i })).toBeVisible()
  const openFilters = page.getByRole('button', { name: 'Abrir filtros' })
  if (await openFilters.isVisible()) await openFilters.click()
  await page.getByRole('button', { name: 'Colecionáveis', exact: true }).click()

  await expect(page.getByRole('link', { name: /Sage Nomad #009/i })).toBeVisible()
  const firstUrl = new URL(page.url())
  expect(firstUrl.searchParams.get('collection')).toBe('Colecionáveis')
  expect(firstUrl.searchParams.get('page')).toBe('1')

  await page.reload()
  await expect(page.getByRole('link', { name: /Sage Nomad #009/i })).toBeVisible()
  const filtersAfterReload = page.getByRole('button', { name: 'Abrir filtros' })
  if (await filtersAfterReload.isVisible()) await filtersAfterReload.click()
  await page.getByRole('button', { name: 'Limpar filtros' }).click()
  await expect(page.getByRole('link', { name: /Emerald Ape #042/i })).toBeVisible()
})

test('detalhes suportam acesso direto e NFT inexistente', async ({ page }) => {
  await page.goto('/nft/1')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042', level: 1 })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Adicionar ao carrinho' })).toBeEnabled()
  await page.goto('/nft/999')
  await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
})

test('carrinho preserva itens após refresh e permite atualizar/remover', async ({ page }) => {
  await page.goto('/nft/1')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await page.getByRole('link', { name: /Ver meu carrinho/i }).click()
  await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Itens do carrinho' }).getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()

  await page.getByRole('button', { name: 'Aumentar quantidade de Emerald Ape #042' }).click()
  await expect(page.getByText('Quantidade atualizada.', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('region', { name: 'Itens do carrinho' }).getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()

  await page.getByRole('button', { name: 'Remover Emerald Ape #042 do carrinho' }).click()
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
})

test('login recupera sessão e protege perfil e carteiras', async ({ page }) => {
  await page.goto('/profile')
  await expect(page).toHaveURL(/\/login\?next=%2Fprofile/)
  await page.getByLabel('E-mail').fill('colecionador@kurio.demo')
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()

  await expect(page).toHaveURL(/\/profile$/)
  await expect(page.getByRole('heading', { name: 'Meu perfil' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Meu perfil' })).toBeVisible()
  await page.goto('/wallets')
  await expect(page.getByRole('heading', { name: 'Carteira principal' })).toBeVisible()
})

test('cadastro rejeita conflito e mostra erro da API simulada', async ({ page }) => {
  await page.goto('/register')
  await page.getByLabel('Nome de usuário').fill('Outro Colecionador')
  await page.getByLabel('E-mail').fill('colecionador@kurio.demo')
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo123!')
  await page.getByLabel('Confirmar senha', { exact: true }).fill('KurioDemo123!')
  await page.getByRole('button', { name: 'Criar perfil' }).click()
  await expect(page.getByRole('alert')).toContainText('Já existe uma conta')
})

test('carrinhos ficam isolados entre usuários demo', async ({ page }) => {
  await page.goto('/nft/1')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('NFT adicionado ao carrinho!')).toBeVisible()

  await page.goto('/login')
  await page.getByLabel('E-mail').fill('colecionador@kurio.demo')
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\?q=/)

  await page.goto('/cart')
  await expect(page.getByRole('region', { name: 'Itens do carrinho' }).getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
  await page.goto('/profile')
  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  await expect(page).toHaveURL(/\/login/)

  await page.getByLabel('E-mail').fill('artista@kurio.demo')
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/profile$/)
  await page.goto('/cart')
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
})
