import { expect, test, type Page } from '@playwright/test'

async function resetDemo(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /SEJA DONO/i })).toBeVisible()
  const response = await page.evaluate(async () =>
    (await fetch('/api/mock/reset-all', { method: 'POST' })).status,
  )
  expect(response).toBe(200)
}

test.beforeEach(async ({ page }) => {
  await resetDemo(page)
})

test('galeria mostra detalhes da mesma arte Figma e abre ampliação acessível', async ({ page }) => {
  await page.goto('/nft/1')

  const gallery = page.getByRole('region', { name: 'Galeria de Emerald Ape #042' })
  const glasses = gallery.getByRole('button', { name: 'Detalhe dos óculos' })
  await expect(glasses).toBeVisible()
  await glasses.click()

  await expect(glasses).toHaveAttribute('aria-pressed', 'true')
  await expect(gallery.locator('[aria-live="polite"] img')).toHaveAttribute(
    'alt', 'Emerald Ape #042, detalhe dos óculos',
  )

  await gallery.getByRole('button', { name: 'Ampliar arte' }).click()
  const dialog = page.getByRole('dialog', { name: 'Arte ampliada de Emerald Ape #042' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('A visualização usa a arte original')
  await dialog.getByRole('button', { name: 'Fechar visualização ampliada' }).click()
  await expect(dialog).not.toBeVisible()

  await gallery.getByRole('button', { name: 'Obra completa' }).click()
  await expect(gallery.locator('[aria-live="polite"] img')).toHaveAttribute(
    'alt', 'Emerald Ape #042, arte completa',
  )
})

test('detalhes, atributos e avaliações são dados do mock, com abas acessíveis', async ({ page }) => {
  await page.goto('/nft/1')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042', level: 1 })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Metadados demonstrativos' })).toContainText('#0042')
  await expect(page.getByRole('region', { name: 'Metadados demonstrativos' })).toContainText('Óculos, Esmeralda, Raro')

  const detailsTab = page.getByRole('tab', { name: 'Detalhes do NFT' })
  const reviewsTab = page.getByRole('tab', { name: 'Avaliações de colecionadores (19)' })

  await expect(detailsTab).toHaveAttribute('aria-selected', 'true')
  await detailsTab.focus()
  await detailsTab.press('ArrowRight')
  await expect(reviewsTab).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tabpanel', { name: 'Avaliações de colecionadores (19)' })).toContainText(
    '4.8',
  )
  await expect(page.getByRole('tabpanel', { name: 'Avaliações de colecionadores (19)' })).toContainText(
    'não há comentários reais',
  )

  await reviewsTab.press('Home')
  await expect(detailsTab).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tabpanel', { name: 'Detalhes do NFT' })).toContainText(
    'Nenhum contrato inteligente real',
  )
})

test('outro NFT não recebe avaliações nem atributos inventados', async ({ page }) => {
  await page.goto('/nft/2')
  await expect(page.getByRole('heading', { name: 'Sage Nomad #009', level: 1 })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Metadados demonstrativos' })).toContainText(
    'Não informados nesta demonstração',
  )
  await page.getByRole('tab', { name: 'Avaliações de colecionadores' }).click()
  await expect(page.getByRole('tabpanel', { name: 'Avaliações de colecionadores' })).toContainText(
    'não possui avaliações na demonstração',
  )
})
