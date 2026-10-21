import { expect, test } from '@playwright/test'

for (const width of [320, 390, 414]) {
  test(`mobile authentication remains readable and usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })

    for (const route of ['/login', '/register'] as const) {
      await page.goto(route)

      const form = page.locator('form')
      const heading = page.getByRole('heading', {
        name: route === '/login' ? 'Entrar' : 'Criar perfil de colecionador',
        exact: true,
      })
      await expect(heading).toBeVisible()
      await expect(page.getByLabel('E-mail', { exact: true })).toBeVisible()
      await expect(form.getByRole('button', {
        name: route === '/login' ? 'Entrar' : 'Criar perfil',
      })).toBeVisible()

      const google = page.getByRole('button', { name: /Continuar com Google/i })
      const facebook = page.getByRole('button', { name: /Continuar com Facebook/i })
      await expect(google).toBeDisabled()
      await expect(facebook).toBeDisabled()
      await expect(page.getByText('Login social indisponível nesta demonstração.')).toBeVisible()

      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(1)
    }
  })
}

test('mobile auth focus, password toggle and original navigation still work', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/register?next=%2Fcheckout&coupon=KURIO10')

  const email = page.getByLabel('E-mail', { exact: true })
  await email.focus()
  await expect(email).toBeFocused()
  await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'password')
  await page.getByRole('button', { name: 'Mostrar senha' }).click()
  await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'text')
  await page.getByRole('button', { name: 'Ocultar senha' }).click()
  await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'password')

  await page.getByRole('link', { name: 'Entre', exact: true }).click()
  await expect(page).toHaveURL(/\/login\?/)
  await expect(page).toHaveURL(/next=%2Fcheckout/)
  await expect(page).toHaveURL(/coupon=KURIO10/)
})

test('reduced motion disables auth entrance without disabling form controls', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/login')

  const panel = page.getByRole('region', { name: 'Entrar' })
  await expect(panel).toBeVisible()
  await expect(panel).toHaveCSS('animation-name', 'none')
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeEnabled()
})
