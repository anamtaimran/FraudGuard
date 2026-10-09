import { useRef, useState } from 'react'
import { Icon, ICONS, Card } from '../components/ui.jsx'

export default function Upload({ data, error, onFile }) {
  const ref = useRef(null)
  const [over, setOver] = useState(false)
  const pick = (f) => f && onFile(f)

  return (
    <>
      <div className="page-head">
        <div>
          <h2 className="page-title">Upload data</h2>
          <p className="muted">Load a transaction JSON file. It is processed in your browser and never sent to a server.</p>
        </div>
      </div>
      {error && <div className="alert" role="alert">{error}</div>}

      <div
        className={`drop ${over ? 'over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files?.[0]) }}
      >
        <Icon d={ICONS.upload} size={32} />
        <p><b>Drag a .json file here</b> or</p>
        <input ref={ref} type="file" accept="application/json,.json" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
        <button className="btn primary" onClick={() => ref.current.click()}>Choose JSON file</button>
      </div>

      <div className="grid2">
        <Card title="Expected format">
          <p className="small">An array of transactions, or an object with a <code>transactions</code> array.</p>
          <p className="small"><b>Required:</b> <code>transaction_id</code> (unique), <code>amount</code> (number).</p>
          <p className="small"><b>Used for scoring if present:</b> <code>country</code>, <code>hour</code> (0-23), <code>device</code> (<code>new_device</code> counts as risk), <code>merchant_category</code>, <code>previous_chargebacks</code>.</p>
          <p className="muted small">Invalid or duplicate rows are skipped and listed below after loading.</p>
        </Card>
        <Card title="Currently loaded">
          {data ? (
            <ul className="plain small">
              <li><b>Source:</b> {data.source}</li>
              {data.meta.name && <li><b>Dataset:</b> {data.meta.name} v{data.meta.version}</li>}
              <li><b>Valid transactions:</b> {data.rows.length}</li>
              <li><b>Fields:</b> {data.fields.join(', ')}</li>
              <li><b>Fraud label fields:</b> {data.labelFields.length ? data.labelFields.join(', ') : 'none found'}</li>
              <li><b>Skipped rows:</b> {data.skipped.length ? data.skipped.join(', ') : 'none'}</li>
            </ul>
          ) : <p className="muted">Nothing loaded yet.</p>}
          {data?.meta.description && <p className="muted small">“{data.meta.description}”</p>}
        </Card>
      </div>
    </>
  )
}
