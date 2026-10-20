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

test('faixa de preço e rede combinam com coleção, ficam na URL e sobrevivem ao refresh', async ({ page }) => {
  const toggle = page.getByRole('button', { name: 'Abrir filtros' })
  if (await page.evaluate(() => window.matchMedia('(max-width: 1023px)').matches)) {
    await expect(toggle).toBeVisible()
    await toggle.click()
    await expect(page.locator('#catalog-filters')).toBeVisible()
  }

  await page.getByRole('radio', { name: 'Polygon' }).check()
  await page.getByRole('button', { name: 'Colecionáveis', exact: true }).click()
  await page.getByRole('textbox', { name: 'Preço mínimo (ETH)' }).fill('1,50')
  await page.getByRole('textbox', { name: 'Preço máximo (ETH)' }).fill('1,80')
  await page.getByRole('button', { name: 'Aplicar faixa de preço' }).click()

  await expect(page.getByRole('link', { name: /Sage Nomad #009/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /Violet Nomad #314/i })).toHaveCount(0)

  const url = new URL(page.url())
  expect(url.searchParams.get('network')).toBe('Polygon')
  expect(url.searchParams.get('collection')).toBe('Colecionáveis')
  // TanStack Router protects numeric-looking strings with JSON quoting in URLs.
  // The decoded values must remain strings after refresh for precise ETH parsing.
  expect(JSON.parse(url.searchParams.get('minPriceEth') ?? 'null')).toBe('1.50')
  expect(JSON.parse(url.searchParams.get('maxPriceEth') ?? 'null')).toBe('1.80')
  expect(url.searchParams.get('page')).toBe('1')

  await page.reload()
  await expect(page.getByRole('link', { name: /Sage Nomad #009/i })).toBeVisible()
  const openFilters = page.getByRole('button', { name: 'Abrir filtros' })
  if (await openFilters.isVisible()) await openFilters.click()
  await expect(page.getByRole('radio', { name: 'Polygon' })).toBeChecked()

  await page.getByRole('textbox', { name: 'Preço mínimo (ETH)' }).fill('2,00')
  await page.getByRole('button', { name: 'Aplicar faixa de preço' }).click()
  await expect(page.getByRole('alert')).toContainText('O preço mínimo não pode ser maior que o máximo.')
  await expect(page.getByRole('link', { name: /Sage Nomad #009/i })).toBeVisible()

  await page.getByRole('button', { name: 'Limpar filtros' }).click()
  await expect(page.getByRole('link', { name: /Emerald Ape #042/i })).toBeVisible()
  expect(new URL(page.url()).searchParams.get('network')).toBe('all')
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
  await expect(page.getByRole('heading', { name: 'Meu perfil', level: 1 })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Meu perfil', level: 1 })).toBeVisible()
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
  // Two login cycles, one logout and cart merge need more than the 15s
  // budget used by short catalog tests on a contended CI runner.
  test.setTimeout(35_000)
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

  // URL change can precede the login route finishing its initial render.
  // Wait for the new form before typing to avoid losing the first input.
  await expect(page.getByRole('heading', { name: 'Entrar', level: 1 })).toBeVisible()
  const signInButton = page.getByRole('button', { name: 'Entrar', exact: true })
  await expect(signInButton).toBeEnabled()
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo123!')
  await page.getByLabel('E-mail').fill('artista@kurio.demo')
  await expect(page.getByLabel('E-mail')).toHaveValue('artista@kurio.demo')
  await signInButton.click()
  await expect(page).toHaveURL(/\?q=/, { timeout: 15_000 })
  await page.goto('/cart')
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
})

test('desktop sorting control is keyboard accessible and persists in the URL', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Sort control is only shown at XL widths.')

  const sort = page.getByRole('combobox', { name: 'Ordenar por:' })
  await expect(sort).toBeVisible()
  await expect(sort).toHaveValue('featured')
  await sort.selectOption('price_desc')
  await expect(sort).toHaveValue('price_desc')
  await expect(page.getByRole('link', { name: /Ver detalhes de Neon Origins #101/i })).toBeVisible()
  expect(new URL(page.url()).searchParams.get('sort')).toBe('price_desc')

  await page.reload()
  await expect(page.getByRole('combobox', { name: 'Ordenar por:' })).toHaveValue('price_desc')
})
