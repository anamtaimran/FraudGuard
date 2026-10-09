const esc = (v) => {
  let s = v == null ? '' : String(v)
  // neutralise spreadsheet formula injection (=, +, -, @ prefixes), keep plain negative numbers
  if (/^[=+\-@\t\r]/.test(s) && Number.isNaN(Number(s))) s = "'" + s
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(rows) {
  if (!rows.length) return ''
  const base = [...new Set(rows.flatMap((r) => Object.keys(r).filter((k) => k !== 'risk')))]
  const head = [...base, 'risk_score', 'risk_level', 'risk_reasons']
  const lines = rows.map((r) =>
    [
      ...base.map((k) => r[k]),
      r.risk.score,
      r.risk.level,
      r.risk.reasons.map((x) => `${x.rule} (+${x.points})`).join('; '),
    ].map(esc).join(','),
  )
  return [head.join(','), ...lines].join('\n')
}

export function download(name, text, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  a.click()
  URL.revokeObjectURL(url)
}
