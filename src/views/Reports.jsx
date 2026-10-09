import { fmt } from '../risk.js'
import { STATUSES, reviewSummary, statusOf } from '../review.js'
import { Card, Kpi, Icon, ICONS, Disclaimer } from '../components/ui.jsx'
import { HBars } from '../components/Charts.jsx'

export default function Reports({ data, stats, reviews, cur, onExport }) {
  const rs = reviewSummary(data.rows, reviews)
  const escalated = data.rows.filter((r) => statusOf(reviews, r.transaction_id) === 'escalated')
  const queue = data.rows.filter((r) => r.risk.level !== 'low' && statusOf(reviews, r.transaction_id) === 'pending')
  return (
    <>
      <div className="page-head">
        <div>
          <h2 className="page-title">Reports</h2>
          <p className="muted">Review progress and exports for {data.source}.</p>
        </div>
        <div className="btn-row">
          <button className="btn" onClick={() => onExport(data.rows, 'all')}><Icon d={ICONS.download} size={16} /> All transactions CSV</button>
          <button className="btn primary" disabled={!queue.length} onClick={() => onExport(queue, 'review-queue')}><Icon d={ICONS.download} size={16} /> Review queue CSV ({queue.length})</button>
        </div>
      </div>
      <Disclaimer />

      <div className="kpis">
        <Kpi icon="flag" label="Flagged" value={rs.flagged} sub="medium + high" tone="amber" />
        <Kpi icon="alert" label="Flagged, awaiting review" value={rs.flaggedPending} tone="red" />
        <Kpi icon="alert" label="Escalated" value={rs.escalated} tone="amber" />
        <Kpi icon="check" label="Cleared" value={rs.cleared} />
      </div>

      <div className="grid2">
        <Card title="Review status (all transactions)">
          <HBars
            rows={Object.entries(STATUSES).map(([k, v]) => ({ name: v.label, value: rs[k], color: k === 'escalated' ? 'var(--medium)' : k === 'cleared' ? 'var(--low)' : 'var(--accent)' }))}
            max={stats.n || 1}
            format={(v) => `${v}`}
          />
          <p className="muted small">Decisions are saved in this browser only and included in CSV exports.</p>
        </Card>
        <Card title="Average score by country">
          <HBars rows={stats.byCountry.map((c) => ({ name: c.key, value: c.avg, sub: `${c.count} txn` }))} max={100} />
        </Card>
      </div>

      <Card title="Escalated transactions">
        {escalated.length ? (
          <ul className="plain">
            {escalated.map((r) => (
              <li key={r.transaction_id}><b className="mono">{r.transaction_id}</b> · {fmt(r.amount, r.currency)} · score {r.risk.score}{reviews[r.transaction_id]?.note ? ` · “${reviews[r.transaction_id].note}”` : ''}</li>
            ))}
          </ul>
        ) : <p className="muted">None escalated yet. Open a transaction and choose Escalate.</p>}
      </Card>
    </>
  )
}
