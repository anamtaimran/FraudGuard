// Explainable, rule-based risk scoring.
// Every point comes from a named rule on a real dataset field. The weights are
// analyst heuristics (NOT learned from labels - the dataset has none), so the
// score is a triage priority, not a probability of fraud.

export const LEVELS = { HIGH: 60, MEDIUM: 30 } // score >= HIGH => high, >= MEDIUM => medium
export const HIGH_RISK_CATEGORIES = ['gift_cards', 'digital_goods']
export const NIGHT_HOURS = [0, 5] // inclusive

export const label = (s) => String(s ?? '').replace(/_/g, ' ')
export const fmt = (n, cur = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: /^[A-Z]{3}$/.test(cur) ? cur : 'USD' }).format(n)

// Most common country in the data = baseline "home" market. Computed, not assumed.
export function baselineCountry(txns) {
  const counts = {}
  for (const t of txns) if (t.country) counts[t.country] = (counts[t.country] || 0) + 1
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
}

export function levelFor(score) {
  return score >= LEVELS.HIGH ? 'high' : score >= LEVELS.MEDIUM ? 'medium' : 'low'
}

/** @returns {{score:number, level:string, reasons:{rule:string, points:number, detail:string}[]}} */
export function scoreTransaction(t, ctx = {}) {
  const reasons = []
  const add = (rule, points, detail) => reasons.push({ rule, points, detail })

  const amount = Number(t.amount)
  if (amount >= 5000) add('Very large amount', 30, `${fmt(amount)} is at or above 5,000`)
  else if (amount >= 1000) add('Large amount', 22, `${fmt(amount)} is at or above 1,000`)
  else if (amount >= 500) add('Elevated amount', 12, `${fmt(amount)} is at or above 500`)

  const hour = Number(t.hour)
  if (t.hour !== undefined && t.hour !== null && Number.isFinite(hour) && hour >= NIGHT_HOURS[0] && hour <= NIGHT_HOURS[1])
    add('Overnight activity', 15, `Made at ${String(hour).padStart(2, '0')}:00 (00:00-05:59)`)

  if (t.device === 'new_device') add('New device', 20, 'Device not previously seen for this customer')

  const cb = Number(t.previous_chargebacks) || 0
  if (cb > 0) add('Chargeback history', Math.min(cb * 10, 30), `${cb} previous chargeback${cb > 1 ? 's' : ''}`)

  if (ctx.baseline && t.country && t.country !== ctx.baseline)
    add('Outside main country', 10, `${t.country} differs from the dataset's most common country (${ctx.baseline})`)

  if (HIGH_RISK_CATEGORIES.includes(t.merchant_category))
    add('Fraud-prone category', 10, `${label(t.merchant_category)} is easy to resell or cash out`)

  const score = Math.min(100, reasons.reduce((s, r) => s + r.points, 0))
  return { score, level: levelFor(score), reasons }
}

export function scoreAll(txns) {
  const ctx = { baseline: baselineCountry(txns) }
  return txns.map((t) => ({ ...t, risk: { ...scoreTransaction(t, ctx), baseline: ctx.baseline } }))
}
