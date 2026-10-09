import { fmt } from '../risk.js'

export const COLORS = { high: 'var(--high)', medium: 'var(--medium)', low: 'var(--low)' }

export function Donut({ high, medium, low }) {
  const total = high + medium + low || 1
  const R = 52, C = 2 * Math.PI * R
  let offset = 0
  const segs = [['high', high], ['medium', medium], ['low', low]]
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 140 140" role="img" aria-label={`${high} high, ${medium} medium, ${low} low risk`} className="donut">
        <circle cx="70" cy="70" r={R} fill="none" stroke="var(--track)" strokeWidth="18" />
        {segs.map(([k, v]) => {
          const len = (v / total) * C
          const el = v > 0 && (
            <circle key={k} cx="70" cy="70" r={R} fill="none" stroke={COLORS[k]} strokeWidth="18"
              strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} transform="rotate(-90 70 70)" />
          )
          offset += len
          return el
        })}
        <text x="70" y="68" textAnchor="middle" className="donut-n">{total === 1 && !high && !medium && !low ? 0 : high + medium + low}</text>
        <text x="70" y="86" textAnchor="middle" className="donut-l">transactions</text>
      </svg>
      <ul className="legend">
        {segs.map(([k, v]) => (
          <li key={k}><i style={{ background: COLORS[k] }} />{k[0].toUpperCase() + k.slice(1)}<b>{v}</b></li>
        ))}
      </ul>
    </div>
  )
}

/** Horizontal bars: rows = [{name, value, sub}] */
export function HBars({ rows, max, format = (v) => v.toFixed(0), color = 'var(--accent)' }) {
  const m = max ?? Math.max(1, ...rows.map((r) => r.value))
  return (
    <ul className="hbars">
      {rows.map((r) => (
        <li key={r.name}>
          <span className="hb-name" title={r.name}>{r.name}</span>
          <span className="hb-track"><span style={{ width: `${(r.value / m) * 100}%`, background: r.color || color }} /></span>
          <span className="hb-val">{format(r.value)}</span>
          {r.sub && <span className="hb-sub">{r.sub}</span>}
        </li>
      ))}
    </ul>
  )
}

export function HourChart({ hours }) {
  const max = Math.max(1, ...hours.map((h) => h.count))
  return (
    <div>
      <div className="hours" role="img" aria-label="Transactions by hour of day">
        {hours.map((h) => (
          <div key={h.hour} className="hour" title={`${String(h.hour).padStart(2, '0')}:00 - ${h.count} txn, ${h.risky} flagged`}>
            <div className="hour-bar" style={{ height: `${(h.count / max) * 100}%` }}>
              <span style={{ height: h.count ? `${(h.risky / h.count) * 100}%` : 0 }} />
            </div>
            <small>{h.hour % 3 === 0 ? h.hour : ''}</small>
          </div>
        ))}
      </div>
      <p className="muted small"><i className="dot" style={{ background: 'var(--accent)' }} /> flagged (medium/high) <i className="dot" style={{ background: 'var(--blue)' }} /> all transactions, by hour (0-23)</p>
    </div>
  )
}

export const money = (n) => fmt(n)
