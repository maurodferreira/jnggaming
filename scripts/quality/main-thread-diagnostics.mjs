/**
 * Read all Lighthouse runs and highlight expensive JavaScript startup work.
 * This is diagnostic only: it does not modify measurements or change scoring.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const directory = resolve('reports/quality')
const files = readdirSync(directory).filter(name => /^(home|nft)-(mobile|desktop)-run[1-3]\.json$/.test(name))
const results = []

for (const filename of files) {
  const lhr = JSON.parse(readFileSync(resolve(directory, filename), 'utf8'))
  const audits = lhr.audits ?? {}
  const scriptDetails = audits['bootup-time']?.details?.items ?? []
  const tasks = audits['long-tasks']?.details?.items ?? []
  const work = audits['mainthread-work-breakdown']?.details?.items ?? []
  const lcpElement = audits['largest-contentful-paint-element']?.details?.items?.[0] ?? null

  const scripts = scriptDetails
    .map(item => ({
      source: String(item.url ?? item.entity ?? '(unknown)'),
      totalMs: Math.round(Number(item.total ?? 0)),
      scriptingMs: Math.round(Number(item.scripting ?? 0)),
      parseMs: Math.round(Number(item.scriptParseCompile ?? 0)),
    }))
    .sort((a, b) => b.totalMs - a.totalMs)
    .slice(0, 10)

  results.push({
    filename,
    performance: Math.round((lhr.categories?.performance?.score ?? 0) * 100),
    lcpMs: Math.round(audits['largest-contentful-paint']?.numericValue ?? 0),
    tbtMs: Math.round(audits['total-blocking-time']?.numericValue ?? 0),
    jsExecutionMs: Math.round(audits['bootup-time']?.numericValue ?? 0),
    mainThreadMs: Math.round(audits['mainthread-work-breakdown']?.numericValue ?? 0),
    work: work.map(item => ({
      group: String(item.groupLabel ?? item.group ?? ''),
      durationMs: Math.round(Number(item.duration ?? 0)),
    })),
    longestTasks: tasks
      .map(item => ({ source: String(item.url ?? '(unknown)'), durationMs: Math.round(Number(item.duration ?? 0)) }))
      .sort((a, b) => b.durationMs - a.durationMs)
      .slice(0, 8),
    scripts,
    lcpElement: lcpElement?.node?.snippet ?? null,
  })
}

writeFileSync(resolve(directory, 'main-thread-diagnostics.json'), JSON.stringify(results, null, 2))
const lines = [
  '# Initial main-thread diagnostics',
  '',
  'Raw findings from each Lighthouse run, not an extra score or pass condition.',
  '',
  '| Run | Performance | LCP ms | TBT ms | JS bootup ms | Main thread ms |',
  '| --- | ---: | ---: | ---: | ---: | ---: |',
  ...results.map(r => `| ${r.filename} | ${r.performance} | ${r.lcpMs} | ${r.tbtMs} | ${r.jsExecutionMs} | ${r.mainThreadMs} |`),
]
for (const result of results) {
  lines.push('', `## ${result.filename}`, '', `LCP element: ${result.lcpElement ?? 'not reported'}`, '', '### Bootup scripts')
  for (const script of result.scripts) {
    lines.push(`- ${script.totalMs} ms (execution ${script.scriptingMs} ms, parsing ${script.parseMs} ms): ${script.source}`)
  }
  lines.push('', '### Long tasks')
  for (const task of result.longestTasks) lines.push(`- ${task.durationMs} ms: ${task.source}`)
  lines.push('', '### Main-thread breakdown')
  for (const item of result.work) lines.push(`- ${item.group}: ${item.durationMs} ms`)
}
writeFileSync(resolve(directory, 'main-thread-diagnostics.md'), lines.join('\n') + '\n')
console.log(lines.slice(0, 14).join('\n'))
