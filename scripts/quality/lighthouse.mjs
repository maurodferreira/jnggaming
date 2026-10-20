/**
 * Repeatable Lighthouse audit against the production Vite preview.
 * Results are evidence, not silently adjusted scores. Three measurements
 * per page and device, with medians instead of a single favorable run.
 *
 * Usage: CHROME_PATH=/path/to/chromium node scripts/quality/lighthouse.mjs
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const directory = resolve('reports/quality')
const origin = process.env.LIGHTHOUSE_ORIGIN ?? 'http://127.0.0.1:4173'
const chrome = process.env.CHROME_PATH
const lighthouseVersion = '12.8.2'
const thresholds = {
  performance: 90,
  accessibility: 95,
  'best-practices': 95,
  seo: 90,
}

mkdirSync(directory, { recursive: true })

function median(values) {
  const ordered = [...values].sort((a, b) => a - b)
  return ordered[Math.floor(ordered.length / 2)]
}

const cases = [
  { page: 'home', path: '/' },
  { page: 'nft', path: '/nft/1' },
]
const measurements = []
const failures = []

if (!chrome) {
  throw Error('Set CHROME_PATH to the installed Chromium executable before auditing.')
}

for (const page of cases) {
  for (const device of ['mobile', 'desktop']) {
    for (let run = 1; run <= 3; run++) {
      const name = `${page.page}-${device}-run${run}`
      const file = resolve(directory, `${name}.json`)
      const args = [
        '--yes', `lighthouse@${lighthouseVersion}`,
        new URL(page.path, origin).toString(),
        '--only-categories=performance,accessibility,best-practices,seo',
        '--output=json',
        `--output-path=${file}`,
        '--no-enable-error-reporting',
        '--quiet',
        '--max-wait-for-load=45000',
        '--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage',
      ]
      if (device === 'desktop') args.push('--preset=desktop')

      console.log(`Running Lighthouse ${name}`)
      const result = spawnSync('npx', args, {
        env: process.env,
        encoding: 'utf8',
        timeout: 150_000,
      })
      if (result.status !== 0 || result.error) {
        failures.push({ name, message: String(result.error ?? result.stderr).slice(-1500) })
        continue
      }

      try {
        const lhr = JSON.parse(readFileSync(file, 'utf8'))
        const scores = Object.fromEntries(
          Object.keys(thresholds).map(key => [key, Math.round((lhr.categories[key]?.score ?? 0) * 100)]),
        )
        measurements.push({
          name, page: page.page, device, scores,
          lcpMs: lhr.audits['largest-contentful-paint']?.numericValue ?? null,
          cls: lhr.audits['cumulative-layout-shift']?.numericValue ?? null,
          tbtMs: lhr.audits['total-blocking-time']?.numericValue ?? null,
        })
      } catch (error) {
        failures.push({ name, message: String(error) })
      }
    }
  }
}

const summary = []
for (const page of cases) {
  for (const device of ['mobile', 'desktop']) {
    const results = measurements.filter(m => m.page === page.page && m.device === device)
    if (results.length !== 3) continue
    const medians = Object.fromEntries(
      Object.keys(thresholds).map(key => [key, median(results.map(m => m.scores[key]))]),
    )
    summary.push({
      page: page.page,
      device,
      medians,
      lcpMs: median(results.map(m => m.lcpMs)),
      cls: median(results.map(m => m.cls)),
      tbtMs: median(results.map(m => m.tbtMs)),
      meetsTargets: Object.entries(thresholds).every(([key, target]) => medians[key] >= target),
    })
  }
}

const report = {
  origin,
  lighthouseVersion,
  thresholds,
  measurements,
  summary,
  failures,
}
writeFileSync(resolve(directory, 'summary.json'), JSON.stringify(report, null, 2))

const lines = [
  '# KURIO — Lighthouse production preview',
  '',
  'Auditoria automatizada em produção local. Cada combinação tem três execuções; os valores são medianas.',
  '',
  '| Página | Dispositivo | Performance | A11y | Boas práticas | SEO | LCP (ms) | CLS | TBT (ms) | Metas |',
  '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |',
  ...summary.map(m => [
    '|', m.page, '|', m.device, '|', m.medians.performance, '|', m.medians.accessibility,
    '|', m.medians['best-practices'], '|', m.medians.seo, '|',
    Math.round(m.lcpMs), '|', m.cls.toFixed(3), '|', Math.round(m.tbtMs),
    '|', m.meetsTargets ? 'OK' : 'Pendente', '|',
  ].join(' ')),
  '',
  ...failures.map(f => `- Falha de execução ${f.name}: ${f.message}`),
]
writeFileSync(resolve(directory, 'summary.md'), lines.join('\n'))
console.log(lines.join('\n'))

// Audit execution errors must be visible. Scores below the requested targets
// are reported as gaps, not hidden or silently promoted to passes.
if (failures.length || summary.length !== cases.length * 2) {
  process.exitCode = 1
}
