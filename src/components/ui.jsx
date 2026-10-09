export const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {[].concat(d).map((p) => <path key={p} d={p} />)}
  </svg>
)

export const ICONS = {
  dashboard: ['M3 3h7v9H3z', 'M14 3h7v5h-7z', 'M14 12h7v9h-7z', 'M3 16h7v5H3z'],
  list: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
  upload: ['M12 16V4', 'M7 9l5-5 5 5', 'M4 20h16'],
  report: ['M6 2h9l5 5v15H6z', 'M14 2v6h6', 'M9 13h7', 'M9 17h7'],
  download: ['M12 4v12', 'M7 11l5 5 5-5', 'M4 20h16'],
  shield: ['M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z', 'M9 12l2 2 4-4'],
  swap: ['M7 7h13', 'M16 3l4 4-4 4', 'M17 17H4', 'M8 13l-4 4 4 4'],
  alert: ['M12 3l10 18H2z', 'M12 10v5', 'M12 18h.01'],
  flag: ['M5 22V4', 'M5 4h13l-2 4 2 4H5'],
  check: ['M20 6L9 17l-5-5'],
  dollar: ['M12 2v20', 'M17 6H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6'],
  close: ['M18 6L6 18', 'M6 6l12 12'],
}

export function Kpi({ icon, label, value, sub, tone = 'teal' }) {
  return (
    <div className="kpi card">
      <span className={`kpi-ico ${tone}`}><Icon d={ICONS[icon]} size={22} /></span>
      <div>
        <p className="muted small">{label}</p>
        <p className="kpi-v">{value}</p>
        {sub && <p className="muted small">{sub}</p>}
      </div>
    </div>
  )
}

export function Card({ title, action, children, className = '' }) {
  return (
    <section className={`card ${className}`}>
      <div className="card-head">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export const Disclaimer = () => (
  <p className="disclaimer">
    <Icon d={ICONS.shield} size={16} />
    <span>Risk scores come from transparent rules and rank transactions for human review. They are <b>review priorities, not confirmed fraud</b>. This dataset has no fraud labels, so no accuracy is measured.</span>
  </p>
)

export const RiskPill = ({ level, children }) => <span className={`pill ${level}`}>{children ?? level}</span>
