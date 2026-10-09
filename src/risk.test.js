import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { scoreTransaction, scoreAll, levelFor, baselineCountry } from './risk.js'
import { parseDataset } from './data.js'
import { toCsv } from './csv.js'
import { summarize } from './stats.js'

const safe = { transaction_id: 'a', amount: 40, country: 'US', hour: 14, merchant_category: 'groceries', device: 'known_mobile', previous_chargebacks: 0 }
const bad = { transaction_id: 'b', amount: 5200, country: 'US', hour: 4, merchant_category: 'digital_goods', device: 'new_device', previous_chargebacks: 3 }

describe('risk scoring', () => {
  it('scores a normal transaction as low with no reasons', () => {
    const r = scoreTransaction(safe, { baseline: 'US' })
    expect(r.score).toBe(0)
    expect(r.level).toBe('low')
    expect(r.reasons).toEqual([])
  })
  it('scores a risky transaction high, capped at 100, with explanations', () => {
    const r = scoreTransaction(bad, { baseline: 'US' })
    expect(r.score).toBe(100)
    expect(r.level).toBe('high')
    expect(r.reasons.map((x) => x.rule)).toContain('New device')
  })
  it('reason points sum to score when under cap', () => {
    const r = scoreTransaction({ ...safe, amount: 600, device: 'new_device' }, { baseline: 'US' })
    expect(r.reasons.reduce((s, x) => s + x.points, 0)).toBe(r.score)
  })
  it('level thresholds', () => {
    expect(levelFor(29)).toBe('low')
    expect(levelFor(30)).toBe('medium')
    expect(levelFor(60)).toBe('high')
  })
  it('baseline country is most common', () => {
    expect(baselineCountry([{ country: 'US' }, { country: 'US' }, { country: 'GB' }])).toBe('US')
  })
})

describe('data handling', () => {
  it('rejects bad shapes and skips invalid / duplicate rows', () => {
    expect(() => parseDataset({})).toThrow()
    const d = parseDataset({ transactions: [safe, safe, { transaction_id: 'x' }, bad] })
    expect(d.rows).toHaveLength(2)
    expect(d.skipped).toEqual([2, 3])
  })
  it('csv escapes and neutralises formulas', () => {
    const csv = toCsv(scoreAll([{ ...safe, transaction_id: '=cmd', merchant_category: 'a,b' }]))
    expect(csv).toContain("'=cmd")
    expect(csv).toContain('"a,b"')
  })
  it('summary counts add up', () => {
    const s = summarize(scoreAll([safe, bad]))
    expect(s.high + s.medium + s.low).toBe(2)
  })
})

describe('real dataset (skipped if file absent)', () => {
  const f = new URL('../03_fraud_transactions.json', import.meta.url)
  it.skipIf(!fs.existsSync(f))('parses fully and has no label field', () => {
    const d = parseDataset(JSON.parse(fs.readFileSync(f, 'utf8')))
    expect(d.rows.length).toBe(12)
    expect(d.skipped).toEqual([])
    expect(d.labelFields).toEqual([])
  })
})

import { recommendedAction, reviewSummary, statusOf } from './review.js'
describe('review workflow', () => {
  it('defaults to pending and counts flagged pending', () => {
    const rows = scoreAll([safe, bad])
    expect(statusOf({}, 'a')).toBe('pending')
    expect(reviewSummary(rows, {}).flaggedPending).toBe(1)
    expect(reviewSummary(rows, { b: { status: 'cleared' } })).toMatchObject({ cleared: 1, flaggedPending: 0 })
  })
  it('action text never claims fraud', () => {
    for (const l of ['high', 'medium', 'low']) expect(recommendedAction(l).toLowerCase()).not.toContain('is fraud')
  })
})
