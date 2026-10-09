import { label } from './risk.js'

export function summarize(rows) {
  const n = rows.length
  const total = rows.reduce((s, r) => s + r.amount, 0)
  const by = (k) => {
    const m = {}
    for (const r of rows) {
      const key = r[k] ?? 'unknown'
      const e = (m[key] ||= { key, count: 0, amount: 0, score: 0, high: 0 })
      e.count++
      e.amount += r.amount
      e.score += r.risk.score
      e.high += r.risk.level === 'high' ? 1 : 0
    }
    return Object.values(m)
      .map((e) => ({ ...e, name: label(e.key), avg: e.score / e.count }))
      .sort((a, b) => b.avg - a.avg || b.amount - a.amount)
  }
  const lv = (l) => rows.filter((r) => r.risk.level === l)
  const flagged = rows.filter((r) => r.risk.level !== 'low')
  const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0, risky: 0 }))
  for (const r of rows) {
    const h = hours[Number(r.hour)]
    if (h) {
      h.count++
      h.risky += r.risk.level !== 'low' ? 1 : 0
    }
  }
  const reasonCount = {}
  for (const r of rows) for (const x of r.risk.reasons) reasonCount[x.rule] = (reasonCount[x.rule] || 0) + 1
  return {
    n, total, avg: n ? total / n : 0,
    high: lv('high').length, medium: lv('medium').length, low: lv('low').length,
    flaggedAmount: flagged.reduce((s, r) => s + r.amount, 0),
    byCategory: by('merchant_category'), byCountry: by('country'),
    hours, reasons: Object.entries(reasonCount).sort((a, b) => b[1] - a[1]),
  }
}
