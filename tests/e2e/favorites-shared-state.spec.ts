import { expect, test, type Page } from '@playwright/test'

async function startClean(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /SEJA DONO/i })).toBeVisible()
  const reset = await page.evaluate(async () =>
    (await fetch('/api/mock/reset-all', { method: 'POST' })).ok,
  )
  expect(reset).toBe(true)
  await page.reload()
}

function card(page: Page, name: string) {
  return page.locator('article').filter({
    has: page.getByRole('link', { name: new RegExp(`Ver detalhes de ${name}`) }),
  })
}

test.beforeEach(async ({ page }) => {
  await startClean(page)
})

test('favorito de visitante mantém o redirecionamento seguro para login', async ({ page }) => {
  await expect(card(page, 'Emerald Ape #042')).toBeVisible()
  await card(page, 'Emerald Ape #042').getByRole('button', { name: 'Adicionar aos favoritos' }).click()
  await expect(page).toHaveURL(/\/login\?next=/)
  await expect(page.getByRole('heading', { name: 'Entrar', level: 1 })).toBeVisible()
})

test('favoritos compartilham estado entre cards e detalhes sem misturar NFTs', async ({ page }) => {
  test.setTimeout(40_000)

  await page.goto('/login')
  await page.getByLabel('E-mail').fill('colecionador@kurio.demo')
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(card(page, 'Emerald Ape #042')).toBeVisible()

  const emerald = card(page, 'Emerald Ape #042')
  const sage = card(page, 'Sage Nomad #009')
  await emerald.getByRole('button', { name: 'Adicionar aos favoritos' }).click()
  await expect(emerald.getByRole('button', { name: 'Remover dos favoritos' })).toHaveAttribute('aria-pressed', 'true')
  await expect(sage.getByRole('button', { name: 'Adicionar aos favoritos' })).toHaveAttribute('aria-pressed', 'false')

  await sage.getByRole('button', { name: 'Adicionar aos favoritos' }).click()
  await expect(sage.getByRole('button', { name: 'Remover dos favoritos' })).toHaveAttribute('aria-pressed', 'true')
  await page.goto('/nft/1')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042', level: 1 })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Remover dos favoritos' }).first()).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042', level: 1 })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Remover dos favoritos' }).first()).toBeVisible()
  await page.goto('/')
  await expect(card(page, 'Sage Nomad #009').getByRole('button', { name: 'Remover dos favoritos' }))
    .toBeVisible()
  await card(page, 'Emerald Ape #042').getByRole('button', { name: 'Remover dos favoritos' }).click()
  await expect(card(page, 'Emerald Ape #042').getByRole('button', { name: 'Adicionar aos favoritos' }))
    .toHaveAttribute('aria-pressed', 'false')
  await expect(card(page, 'Sage Nomad #009').getByRole('button', { name: 'Remover dos favoritos' }))
    .toHaveAttribute('aria-pressed', 'true')
})
