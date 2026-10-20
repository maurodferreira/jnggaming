/**
 * Production artifact inventory for mobile performance experiments.
 * Distinguishes total emitted assets from the initially referenced scripts.
 * Gzip/brotli are estimates; actual transfers still depend on HTTP negotiation.
 */
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { gzipSync, brotliCompressSync } from 'node:zlib'

const directory = resolve('dist/assets')
const reportDir = resolve('reports/quality')
mkdirSync(reportDir, { recursive: true })

const files = readdirSync(directory).filter(file => file.endsWith('.js'))
const sizes = files.map(name => {
  const data = readFileSync(resolve(directory, name))
  return {
    name,
    bytes: data.byteLength,
    gzipBytes: gzipSync(data, { level: 9 }).byteLength,
    brotliBytes: brotliCompressSync(data).byteLength,
  }
}).sort((a, b) => b.bytes - a.bytes)

const html = readFileSync(resolve('dist/index.html'), 'utf8')
const initialScripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+\.js)"[^>]*>/g)]
  .map(match => match[1])
const modulePreloads = [...html.matchAll(/<link\b[^>]*rel="modulepreload"[^>]*href="([^"]+\.js)"[^>]*>/g)]
  .map(match => match[1])

const sum = key => sizes.reduce((total, file) => total + file[key], 0)
const report = {
  initialScripts,
  modulePreloads,
  jsFiles: sizes.length,
  totalBytes: sum('bytes'),
  totalGzipBytes: sum('gzipBytes'),
  totalBrotliBytes: sum('brotliBytes'),
  chunks: sizes,
}
writeFileSync(resolve(reportDir, 'bundle-sizes.json'), JSON.stringify(report, null, 2))
const kb = bytes => (bytes / 1024).toFixed(1)
const lines = [
  '# Vite/Rolldown emitted JavaScript bundle sizes',
  '',
  `Total JS: ${kb(report.totalBytes)} KiB raw / ${kb(report.totalGzipBytes)} KiB gzip / ${kb(report.totalBrotliBytes)} KiB Brotli.`,
  '',
  `Initial script references: ${initialScripts.join(', ') || '(none)'}`,
  `HTML module preloads: ${modulePreloads.join(', ') || '(none)'}`,
  '',
  '| Chunk | Raw KiB | Gzip KiB | Brotli KiB |',
  '| --- | ---: | ---: | ---: |',
  ...sizes.map(file => `| ${file.name} | ${kb(file.bytes)} | ${kb(file.gzipBytes)} | ${kb(file.brotliBytes)} |`),
  '',
  'These are generated asset sizes, not a promise of faster LCP; the Lighthouse audit is the acceptance evidence.',
]
writeFileSync(resolve(reportDir, 'bundle-sizes.md'), lines.join('\n') + '\n')
console.log(lines.slice(0, 13).join('\n'))
