# FraudGuard

Fraud monitoring dashboard built with React + Vite. Loads a transaction JSON file, scores every transaction with transparent rules, and shows stats, charts, a searchable table and a "why was this flagged" detail view. Runs entirely in the browser.

## Quick start

```bash
npm install
npm run dev        # open the printed http://localhost:5173
npm test           # unit tests
npm run build      # production build into dist/
npm run preview    # serve the production build locally
```

Requires Node 18+.

## The dataset

`03_fraud_transactions.json` (kept in the project root, **git-ignored**) is described by its own metadata as *"Synthetic transactions ... Risk flags are not ground-truth fraud labels."*

- 12 transactions, all USD
- Fields: `transaction_id`, `customer_id`, `amount`, `currency`, `country`, `hour`, `merchant_category`, `device`, `previous_chargebacks`
- **No fraud labels**, so no accuracy, precision or recall is calculated or claimed anywhere.

In `npm run dev` / `npm run preview`, the app auto-loads this file from the project root through a local-only route (`vite.config.js`). The file is **not** copied into `dist/`, so a deployed build contains no data; visitors use **Upload JSON**. Uploaded files are read in the browser and never sent anywhere.

Accepted upload format: an array, or `{ "transactions": [...] }`. Required per row: `transaction_id`, `amount` (numeric, unique id). Other fields are optional and only affect the rules that use them. Invalid or duplicate rows are skipped and listed in the banner.

## How risk scoring works

Defined in [src/risk.js](src/risk.js). Points are added per rule, capped at 100:

| Rule | Field | Points |
|---|---|---|
| Elevated / Large / Very large amount | `amount` >= 500 / 1,000 / 5,000 | 12 / 22 / 30 |
| Overnight activity | `hour` 0-5 | 15 |
| New device | `device == new_device` | 20 |
| Chargeback history | `previous_chargebacks` | 10 each, max 30 |
| Outside main country | `country` differs from the most common country in the loaded data | 10 |
| Fraud-prone category | `gift_cards`, `digital_goods` | 10 |

Levels: **high** >= 60, **medium** >= 30, **low** < 30.

These weights are analyst heuristics chosen for explainability, not learned from data. The score is a triage priority, not a probability of fraud. Tune the constants at the top of `src/risk.js`.

## Features

- Sidebar pages: **Dashboard**, **Transactions**, **Upload Data**, **Reports**
- Dashboard: KPI cards, risk donut, top risk indicators, average score by category, activity by hour, recent flagged transactions (all computed from the loaded data)
- Transactions: search (including rule names), risk and review-status filters, sortable columns, detail panel with every triggered rule, points and reason
- Human review: Escalate / Mark cleared / Reset plus an analyst note per transaction. Saved in this browser only (localStorage), never inferred, included in CSV exports
- Reports: review progress, escalated list, CSV of all transactions or the pending review queue
- Upload JSON (click or drag-drop); Export CSV (adds risk_score, risk_level, risk_reasons, review_status, review_note; guards against spreadsheet formula injection)
- Responsive, keyboard accessible, skip link, dark navy/teal theme

## Project layout

```
src/risk.js        scoring rules
src/data.js        JSON parsing/validation
src/stats.js       dashboard aggregates
src/csv.js         CSV export
src/review.js      review workflow + storage
src/App.jsx        shell, data loading, routing
src/views/         Dashboard, Transactions, Upload, Reports
src/components/    sidebar, charts, detail panel, shared UI
src/risk.test.js   tests (vitest)
```

## Keeping data private

- Dataset is in `.gitignore` - never `git add -f` it.
- Do not put it in `public/` (anything there is deployed).
- If you deploy, deploy `dist/` only; it contains no transaction data.
