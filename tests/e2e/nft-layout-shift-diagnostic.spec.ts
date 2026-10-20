import { expect, test } from '@playwright/test'

/**
 * Guard against layout regressions when the simulated NFT API is slow.
 * The skeleton and the final detail should keep the visible page stable.
 */
test('NFT skeleton-to-detail transition keeps CLS under 0.1', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Inspect desktop geometry once.')

  await page.addInitScript(() => {
    type ShiftSource = { node?: Node; previousRect?: DOMRectReadOnly; currentRect?: DOMRectReadOnly }
    type ShiftEntry = PerformanceEntry & { value: number; hadRecentInput: boolean; sources?: ShiftSource[] }
    const target = window as Window & { __kurioShifts?: unknown[] }
    target.__kurioShifts = []

    const observer = new PerformanceObserver(list => {
      for (const raw of list.getEntries()) {
        const entry = raw as ShiftEntry
        if (entry.hadRecentInput) continue
        target.__kurioShifts?.push({
          value: entry.value,
          atMs: entry.startTime,
          sources: (entry.sources ?? []).map(source => ({
            element: source.node instanceof Element
              ? source.node.tagName.toLowerCase() + '.' + [...source.node.classList].slice(0, 4).join('.')
              : null,
            previous: source.previousRect
              ? { top: source.previousRect.top, left: source.previousRect.left, width: source.previousRect.width, height: source.previousRect.height }
              : null,
            current: source.currentRect
              ? { top: source.currentRect.top, left: source.currentRect.left, width: source.currentRect.width, height: source.currentRect.height }
              : null,
          })),
        })
      }
    })
    observer.observe({ type: 'layout-shift', buffered: true })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /SEJA DONO/i })).toBeVisible()
  const response = await page.evaluate(async () => (
    await fetch('/api/mock/catalog-network', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'slow' }),
    })
  ).status)
  expect(response).toBe(200)

  await page.goto('/nft/1')
  await expect(page.getByRole('main', { name: 'Carregando NFT' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042', level: 1 })).toBeVisible({ timeout: 20_000 })

  const diagnostics = await page.evaluate(() => {
    const target = window as Window & { __kurioShifts?: unknown[] }
    return target.__kurioShifts ?? []
  })
  const totalCls = (diagnostics as Array<{ value: number }>).reduce(
    (total, entry) => total + entry.value,
    0,
  )
  expect(totalCls, `Layout shifts: ${JSON.stringify(diagnostics)}`).toBeLessThan(0.1)
})
