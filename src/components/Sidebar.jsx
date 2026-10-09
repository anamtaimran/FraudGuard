import { Icon, ICONS } from './ui.jsx'

export const PAGES = [
  ['dashboard', 'Dashboard', 'dashboard'],
  ['transactions', 'Transactions', 'list'],
  ['upload', 'Upload Data', 'upload'],
  ['reports', 'Reports', 'report'],
]

export default function Sidebar({ page, onNav, pending }) {
  return (
    <nav className="sidebar" aria-label="Main">
      <div className="brand">
        <span className="logo"><Icon d={ICONS.shield} size={24} /></span>
        <div>
          <h1>FraudGuard</h1>
          <p className="muted tiny">Explainable fraud triage</p>
        </div>
      </div>
      <ul>
        {PAGES.map(([id, name, icon]) => (
          <li key={id}>
            <button className={`nav ${page === id ? 'on' : ''}`} aria-current={page === id ? 'page' : undefined} onClick={() => onNav(id)}>
              <Icon d={ICONS[icon]} />
              <span>{name}</span>
              {id === 'transactions' && pending > 0 && <em className="badge" aria-label={`${pending} flagged awaiting review`}>{pending}</em>}
            </button>
          </li>
        ))}
      </ul>
      <div className="side-note">
        <b>Rule-based scoring</b>
        <p className="muted small">Every score is the sum of named rules on real fields. A person makes the final call.</p>
      </div>
    </nav>
  )
}
