import { useEffect, useMemo, useState } from 'react'
import { parseDataset } from './data.js'
import { scoreAll } from './risk.js'
import { summarize } from './stats.js'
import { toCsv, download } from './csv.js'
import { useReviews, statusOf, reviewSummary } from './review.js'
import Sidebar, { PAGES } from './components/Sidebar.jsx'
import Detail from './components/Detail.jsx'
import Dashboard from './views/Dashboard.jsx'
import Transactions from './views/Transactions.jsx'
import Upload from './views/Upload.jsx'
import Reports from './views/Reports.jsx'

const pageFromHash = () => {
  const h = location.hash.slice(1)
  return PAGES.some(([id]) => id === h) ? h : 'dashboard'
}

export default function App() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(pageFromHash)
  const [level, setLevel] = useState('all')
  const [open, setOpen] = useState(null)

  const scope = data ? `${data.source}:${data.rows.length}` : 'none'
  const [reviews, setReview] = useReviews(scope)

  const nav = (p) => {
    setPage(p)
    history.replaceState(null, '', `#${p}`)
    window.scrollTo(0, 0)
  }
  useEffect(() => {
    const f = () => setPage(pageFromHash())
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])

  const load = (json, source) => {
    const d = parseDataset(json)
    setData({ ...d, rows: scoreAll(d.rows), source })
    setError('')
    setOpen(null)
    setLevel('all')
  }

  // Local dev/preview dataset only; deployed builds have none -> user uploads.
  useEffect(() => {
    fetch('/__local/dataset.json')
      .then((r) => (r.ok && r.headers.get('content-type')?.includes('json') ? r.json() : Promise.reject()))
      .then((j) => load(j, '03_fraud_transactions.json (local)'))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const onFile = async (f) => {
    try {
      load(JSON.parse(await f.text()), f.name)
      nav('dashboard')
    } catch (err) {
      setError(err instanceof SyntaxError ? 'That file is not valid JSON.' : err.message)
      nav('upload')
    }
  }

  const rows = data?.rows ?? []
  const stats = useMemo(() => summarize(rows), [rows])
  const pending = useMemo(() => reviewSummary(rows, reviews).flaggedPending, [rows, reviews])
  const cur = rows[0]?.currency

  const exportCsv = (list, name = 'view') => {
    const withReview = list.map((r) => ({
      ...r,
      review_status: statusOf(reviews, r.transaction_id),
      review_note: reviews[r.transaction_id]?.note ?? '',
    }))
    download(`fraudguard-${name}-${list.length}-transactions.csv`, toCsv(withReview))
  }

  const openTxn = (t) => setOpen(t)
  const view = () => {
    if (loading) return <p className="muted center">Loading…</p>
    if (page === 'upload' || !data) return <Upload data={data} error={error} onFile={onFile} />
    if (page === 'transactions')
      return <Transactions rows={rows} reviews={reviews} level={level} setLevel={setLevel} onOpen={openTxn} onExport={(l) => exportCsv(l, level)} stats={stats} />
    if (page === 'reports') return <Reports data={data} stats={stats} reviews={reviews} cur={cur} onExport={exportCsv} />
    return <Dashboard data={data} stats={stats} reviews={reviews} onOpen={openTxn} onNav={(p) => { setLevel('all'); nav(p) }} cur={cur} />
  }

  return (
    <div className="shell">
      <a className="skip" href="#main">Skip to content</a>
      <Sidebar page={data ? page : 'upload'} onNav={nav} pending={pending} />
      <main id="main" className="content">
        {error && page !== 'upload' && <div className="alert" role="alert">{error}</div>}
        {view()}
        <footer className="muted tiny foot">FraudGuard · synthetic practice data · rule-based review priorities, not confirmed fraud.</footer>
      </main>
      {open && <Detail txn={open} all={rows} reviews={reviews} onReview={setReview} onClose={() => setOpen(null)} onPick={setOpen} />}
    </div>
  )
}
