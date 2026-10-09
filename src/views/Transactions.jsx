import { useMemo, useState } from 'react'
import { fmt, label } from '../risk.js'
import { STATUSES, statusOf } from '../review.js'
import { Icon, ICONS, RiskPill, Disclaimer } from '../components/ui.jsx'

const COLS = [
  ['transaction_id', 'ID'], ['customer_id', 'Customer'], ['amount', 'Amount', 'r'], ['country', 'Country'],
  ['hour', 'Hour', 'r'], ['merchant_category', 'Category'], ['device', 'Device'], ['previous_chargebacks', 'Chargebacks', 'r'],
  ['score', 'Risk'], ['review', 'Review'],
]

export default function Transactions({ rows, reviews, level, setLevel, onOpen, onExport, stats }) {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState({ key: 'score', dir: -1 })

  const view = useMemo(() => {
    const s = q.trim().toLowerCase()
    const val = (r) => (sort.key === 'score' ? r.risk.score : sort.key === 'review' ? statusOf(reviews, r.transaction_id) : r[sort.key])
    return rows
      .filter((r) => {
        if (level !== 'all' && r.risk.level !== level) return false
        if (status !== 'all' && statusOf(reviews, r.transaction_id) !== status) return false
        if (!s) return true
        return (
          Object.entries(r).some(([k, v]) => k !== 'risk' && String(v).toLowerCase().replace(/_/g, ' ').includes(s)) ||
          r.risk.reasons.some((x) => x.rule.toLowerCase().includes(s))
        )
      })
      .sort((a, b) => {
        const x = val(a), y = val(b)
        return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''))) * sort.dir
      })
  }, [rows, reviews, q, level, status, sort])

  const toggle = (key) => setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: key === 'score' || key === 'amount' ? -1 : 1 }))

  return (
    <>
      <div className="page-head">
        <div>
          <h2 className="page-title">Transaction investigation</h2>
          <p className="muted">Search, filter and review transactions. Click a row to see why it was flagged.</p>
        </div>
        <button className="btn primary" disabled={!view.length} onClick={() => onExport(view)}>
          <Icon d={ICONS.download} size={16} /> Export CSV ({view.length})
        </button>
      </div>
      <Disclaimer />

      <section className="card">
        <div className="toolbar">
          <div className="field grow">
            <label htmlFor="q" className="small muted">Search</label>
            <input id="q" type="search" placeholder="ID, customer, country, category, rule…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="lv" className="small muted">Risk level</label>
            <select id="lv" value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="all">All ({stats.n})</option>
              <option value="high">High ({stats.high})</option>
              <option value="medium">Medium ({stats.medium})</option>
              <option value="low">Low ({stats.low})</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="st" className="small muted">Review status</label>
            <select id="st" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All</option>
              {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>

        <div className="scroll">
          <table>
            <thead>
              <tr>
                {COLS.map(([k, name, cls]) => (
                  <th key={k} className={cls} aria-sort={sort.key === k ? (sort.dir > 0 ? 'ascending' : 'descending') : 'none'}>
                    <button className="th" onClick={() => toggle(k)}>{name}{sort.key === k ? (sort.dir > 0 ? ' ▲' : ' ▼') : ''}</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {view.map((r) => {
                const st = statusOf(reviews, r.transaction_id)
                return (
                  <tr key={r.transaction_id} tabIndex={0} className={r.risk.level} onClick={() => onOpen(r)} onKeyDown={(e) => e.key === 'Enter' && onOpen(r)}>
                    <td className="mono">{r.transaction_id}</td>
                    <td>{r.customer_id}</td>
                    <td className="r">{fmt(r.amount, r.currency)}</td>
                    <td>{r.country}</td>
                    <td className="r">{r.hour}</td>
                    <td>{label(r.merchant_category)}</td>
                    <td>{label(r.device)}</td>
                    <td className="r">{r.previous_chargebacks}</td>
                    <td><RiskPill level={r.risk.level}>{r.risk.score} · {r.risk.level}</RiskPill></td>
                    <td><span className={`st ${st}`}>{STATUSES[st].label}</span></td>
                  </tr>
                )
              })}
              {!view.length && <tr><td colSpan={COLS.length} className="muted center">No transactions match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="muted small" aria-live="polite">Showing {view.length} of {rows.length} transactions.</p>
      </section>
    </>
  )
}
