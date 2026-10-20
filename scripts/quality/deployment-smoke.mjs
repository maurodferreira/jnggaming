/**
 * Browser smoke test of the PUBLIC Vercel production alias.
 * This runs outside the Vite dev server and validates deep links, assets
 * and the Service Worker MSW mock in a real production deployment.
 */
import { chromium } from '@playwright/test'

const origin = process.env.KURIO_DEPLOY_URL ?? 'https://kurio-jungle-challenge.vercel.app'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
const errors = []
page.on('pageerror', error => errors.push(error.message))
const results = []
const record = (name, ok, detail = '') => {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ': ' + detail : ''}`)
}
const failIf = (condition, message) => { if (condition) throw Error(message) }
try {
  const html = await page.goto(origin + '/?q=&collection=all&available=false&sort=featured&page=1', {
    waitUntil: 'domcontentloaded', timeout: 45_000,
  })
  const status = html?.status() ?? 0
  failIf(status >= 400, `Home returned HTTP ${status}`)
  const title = await page.title()
  if (/Authentication Required|Vercel Authentication|Log in to Vercel/i.test(title)) {
    throw Error(`Production domain is protected by Vercel Authentication (${title})`)
  }
  await page.getByRole('heading', { name: /SEJA DONO/i }).waitFor({ timeout: 30_000 })
  await page.getByRole('link', { name: /Ver detalhes de Emerald Ape #042/i }).waitFor({ timeout: 25_000 })
  record('Public catalog with NFT mock data', true, `HTTP ${status}`)

  const worker = await page.evaluate(async () => {
    const response = await fetch('/mockServiceWorker.js', { cache: 'no-store' })
    const body = await response.text()
    const registrations = await navigator.serviceWorker.getRegistrations()
    return { status: response.status, js: /Mock Service Worker|msw/i.test(body), registered: registrations.length > 0 }
  })
  failIf(worker.status !== 200 || !worker.js || !worker.registered, JSON.stringify(worker))
  record('Production MSW Service Worker', true)

  const api = await page.evaluate(async () => {
    const response = await fetch('/api/nfts?limit=1')
    const body = await response.json()
    return { status: response.status, count: body.items?.length }
  })
  failIf(api.status !== 200 || api.count !== 1, JSON.stringify(api))
  record('Production REST mock responds with NFT fixture', true)

  const images = await page.locator('main img').evaluateAll(nodes => nodes.slice(0, 2).map(i => ({
    src: i.getAttribute('src'), naturalWidth: i.naturalWidth, complete: i.complete,
  })))
  failIf(!images.length || images.some(i => i.complete && !i.naturalWidth), JSON.stringify(images))
  record('Homepage NFT image assets', true)

  const deepLinks = [
    { path: '/nft/1', selector: 'h1' },
    { path: '/cart', selector: 'h1' },
    { path: '/login', selector: 'main' },
    { path: '/register', selector: 'main' },
  ]
  for (const { path, selector } of deepLinks) {
    const response = await page.goto(origin + path, { waitUntil: 'domcontentloaded', timeout: 40_000 })
    failIf(!response || response.status() !== 200, `${path}: HTTP ${response?.status()}`)
    await page.locator(selector).first().waitFor({ timeout: 25_000 })
    const body = await page.locator('body').innerText()
    failIf(/Authentication Required|Vercel Authentication/.test(body), `Vercel access gate at ${path}`)
    record(`Deep link ${path}`, true)
  }
  await page.goto(origin + '/nft/1', { waitUntil: 'domcontentloaded', timeout: 40_000 })
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 40_000 })
  await page.getByRole('heading', { name: 'Emerald Ape #042', level: 1 }).waitFor({ timeout: 25_000 })
  record('Hard refresh on /nft/1 keeps SPA route', true)

  const checkout = await page.goto(origin + '/checkout', { waitUntil: 'domcontentloaded' })
  failIf(!checkout || checkout.status() !== 200, 'Checkout route does not rewrite to index.html')
  await page.waitForURL(/\/login\?/, { timeout: 25_000 })
  record('Protected checkout redirects to demo login', true, new URL(page.url()).pathname)

  failIf(errors.length > 0, `Browser JS errors: ${errors.join(' | ')}`)
  record('No uncaught browser errors', true)
} catch (error) {
  record('PUBLIC_DEPLOY_SMOKE', false, String(error))
  try {
    await page.screenshot({ path: 'kurio-deployment-smoke-failure.png', fullPage: true })
  } catch { /* Screenshot is best-effort for CI troubleshooting. */ }
} finally {
  await browser.close()
}
const failures = results.filter(item => !item.ok)
console.log(`DEPLOY_SMOKE_RESULT ${JSON.stringify({ passed: results.length - failures.length, failed: failures.length, results })}`)
if (failures.length) process.exitCode = 1
