// Parsing + validation of uploaded/loaded datasets. Nothing is invented:
// rows missing required fields are skipped and reported.
const REQUIRED = ['transaction_id', 'amount']

export function parseDataset(json) {
  const list = Array.isArray(json) ? json : json?.transactions
  if (!Array.isArray(list)) throw new Error('JSON must be an array or an object with a "transactions" array.')
  const rows = []
  const skipped = []
  const seen = new Set()
  list.forEach((r, i) => {
    const ok =
      r && typeof r === 'object' &&
      REQUIRED.every((k) => r[k] !== undefined && r[k] !== null && r[k] !== '') &&
      Number.isFinite(Number(r.amount)) &&
      !seen.has(r.transaction_id)
    if (!ok) return skipped.push(i + 1)
    seen.add(r.transaction_id)
    rows.push({ ...r, amount: Number(r.amount) })
  })
  if (!rows.length) throw new Error('No valid transactions found (need transaction_id and numeric amount).')
  const fields = [...new Set(rows.flatMap(Object.keys))]
  const labelFields = fields.filter((f) => /fraud|label|class/i.test(f))
  return {
    meta: { name: json?.dataset, version: json?.version, description: json?.description },
    rows, skipped, fields, labelFields,
  }
}
