import { fmt, label } from '../risk.js'
import { STATUSES, statusOf } from '../review.js'
import { Donut, HBars, HourChart } from '../components/Charts.jsx'
import { Card, Kpi, RiskPill, Disclaimer } from '../components/ui.jsx'

const pct = (a, b) => (b ? `${((a / b) * 100).toFixed(1)}%` : '0%')

export default function Dashboard({ data, stats, reviews, onOpen, onNav, cur }) {
  const flagged = data.rows.filter((r) => r.risk.level !== 'low').sort((a, b) => b.risk.score - a.risk.score)
  const top = flagged.slice(0, 6)
  return (
    <>
      <div className="page-head">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="muted">Overview of {stats.n} loaded transactions. Source: {data.source}</p>
        </div>
      </div>
      <Disclaimer />

      <div className="kpis">
        <Kpi icon="swap" label="Total transactions" value={stats.n} sub={`avg ${fmt(stats.avg, cur)}`} />
        <Kpi icon="flag" label="Flagged (medium + high)" value={stats.high + stats.medium} sub={`${pct(stats.high + stats.medium, stats.n)} of total`} tone="amber" />
        <Kpi icon="alert" label="High risk" value={stats.high} sub={`${pct(stats.high, stats.n)} of total`} tone="red" />
        <Kpi icon="alert" label="Medium risk" value={stats.medium} sub={`${pct(stats.medium, stats.n)} of total`} tone="amber" />
        <Kpi icon="check" label="Low risk" value={stats.low} sub={`${pct(stats.low, stats.n)} of total`} />
        <Kpi icon="dollar" label="Total amount" value={fmt(stats.total, cur)} sub={`${fmt(stats.flaggedAmount, cur)} flagged`} tone="blue" />
      </div>

      <div className="grid3">
        <Card title="Risk distribution"><Donut high={stats.high} medium={stats.medium} low={stats.low} /></Card>
        <Card title="Top risk indicators" className="span2">
          <HBars
            rows={stats.reasons.map(([name, value]) => ({ name, value, sub: `${pct(value, stats.n)}` }))}
            max={stats.n}
            format={(v) => `${v}`}
          />
          <p className="muted small">Count of transactions where each rule fired.</p>
        </Card>
      </div>

      <div className="grid2">
        <Card title="Average risk score by category">
          <HBars rows={stats.byCategory.map((c) => ({ name: c.name, value: c.avg, sub: `${c.count} txn` }))} max={100} />
        </Card>
        <Card title="Activity by hour of day"><HourChart hours={stats.hours} /></Card>
      </div>

      <Card
        title="Recent flagged transactions"
        action={<button className="link" onClick={() => onNav('transactions')}>View all →</button>}
      >
        <p className="muted small">Highest-scoring flagged transactions. The dataset has an hour field but no date, so they are ranked by score, not time.</p>
        <div className="scroll">
          <table>
            <thead><tr><th>ID</th><th>Customer</th><th className="r">Amount</th><th>Country</th><th>Category</th><th>Risk</th><th>Top reasons</th><th>Review</th></tr></thead>
            <tbody>
              {top.map((r) => (
                <tr key={r.transaction_id} tabIndex={0} onClick={() => onOpen(r)} onKeyDown={(e) => e.key === 'Enter' && onOpen(r)}>
                  <td className="mono">{r.transaction_id}</td>
                  <td>{r.customer_id}</td>
                  <td className="r">{fmt(r.amount, r.currency)}</td>
                  <td>{r.country}</td>
                  <td>{label(r.merchant_category)}</td>
                  <td><RiskPill level={r.risk.level}>{r.risk.score} · {r.risk.level}</RiskPill></td>
                  <td className="wrap">{r.risk.reasons.slice(0, 2).map((x) => x.rule).join(' + ')}</td>
                  <td><span className={`st ${statusOf(reviews, r.transaction_id)}`}>{STATUSES[statusOf(reviews, r.transaction_id)].label}</span></td>
                </tr>
              ))}
              {!top.length && <tr><td colSpan={8} className="muted center">No flagged transactions in this data.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
