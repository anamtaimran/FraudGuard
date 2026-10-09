import { useEffect, useState } from 'react'
import { fmt, label } from '../risk.js'
import { STATUSES, recommendedAction, statusOf } from '../review.js'
import { Icon, ICONS, RiskPill } from './ui.jsx'

export default function Detail({ txn, all, reviews, onReview, onClose, onPick }) {
  const saved = reviews[txn.transaction_id]
  const [note, setNote] = useState(saved?.note || '')

  useEffect(() => setNote(reviews[txn.transaction_id]?.note || ''), [txn.transaction_id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])

  const { risk } = txn
  const status = statusOf(reviews, txn.transaction_id)
  const sameCustomer = all.filter((t) => t.customer_id && t.customer_id === txn.customer_id && t.transaction_id !== txn.transaction_id)
  const fields = Object.entries(txn).filter(([k]) => k !== 'risk')
  const raw = risk.reasons.reduce((s, r) => s + r.points, 0)

  return (
    <div className="overlay" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={`Details for ${txn.transaction_id}`} onClick={(e) => e.stopPropagation()}>
        <header>
          <div>
            <p className="eyebrow">Transaction details</p>
            <h2>{txn.transaction_id} <RiskPill level={risk.level}>{risk.level} risk</RiskPill></h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close details"><Icon d={ICONS.close} /></button>
        </header>

        <div className="detail-grid">
          <div className="panel">
            <h3>Risk score</h3>
            <div className={`gauge ${risk.level}`} style={{ '--p': risk.score }} role="img" aria-label={`Risk score ${risk.score} out of 100`}>
              <b>{risk.score}</b><small>/100</small>
            </div>
          </div>
          <div className="panel">
            <h3>Recommended action</h3>
            <p>{recommendedAction(risk.level)}</p>
            <p className="muted small">Guidance from the score only. It does not mean the transaction is fraudulent.</p>
          </div>
        </div>

        <h3>Why it was flagged</h3>
        {risk.reasons.length === 0 ? (
          <p className="muted">No risk rules triggered.</p>
        ) : (
          <ul className="reasons">
            {risk.reasons.map((r) => (
              <li key={r.rule}>
                <div className="reason-top"><b>{r.rule}</b><span>+{r.points}</span></div>
                <div className="reason-bar"><span style={{ width: `${r.points}%` }} /></div>
                <p className="muted small">{r.detail}</p>
              </li>
            ))}
          </ul>
        )}
        {raw > 100 && <p className="muted small">Rule points total {raw}; score is capped at 100.</p>}

        <h3>Human review</h3>
        <div className="panel review">
          <p className="small">Current status: <b className={`st ${status}`}>{STATUSES[status].label}</b>{saved?.at && <span className="muted"> · saved {new Date(saved.at).toLocaleString()}</span>}</p>
          <label className="small muted" htmlFor="note">Analyst note (stored in this browser only)</label>
          <textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Contacted customer, confirmed purchase" />
          <div className="btn-row">
            <button className="btn warn" onClick={() => onReview(txn.transaction_id, 'escalated', note)}>Escalate</button>
            <button className="btn primary" onClick={() => onReview(txn.transaction_id, 'cleared', note)}>Mark cleared</button>
            <button className="btn" onClick={() => { onReview(txn.transaction_id, 'pending', ''); setNote('') }}>Reset</button>
          </div>
        </div>

        <h3>Transaction fields</h3>
        <dl className="fields">
          {fields.map(([k, v]) => (
            <div key={k}><dt>{label(k)}</dt><dd>{k === 'amount' ? fmt(v, txn.currency) : String(v)}</dd></div>
          ))}
        </dl>

        {sameCustomer.length > 0 && (
          <>
            <h3>Other transactions by {txn.customer_id}</h3>
            <ul className="related">
              {sameCustomer.map((t) => (
                <li key={t.transaction_id}>
                  <button className="link" onClick={() => onPick(t)}>{t.transaction_id}</button>
                  <span>{fmt(t.amount, t.currency)}</span>
                  <RiskPill level={t.risk.level}>{t.risk.score}</RiskPill>
                </li>
              ))}
            </ul>
          </>
        )}
      </aside>
    </div>
  )
}
