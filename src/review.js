import { useCallback, useEffect, useState } from 'react'

// Human-review workflow. Decisions are made by the analyst and stored only in
// this browser (localStorage), keyed by transaction_id. They are never inferred.
export const STATUSES = {
  pending: { label: 'Pending review', hint: 'Not yet reviewed' },
  escalated: { label: 'Escalated', hint: 'Analyst wants a deeper investigation' },
  cleared: { label: 'Cleared', hint: 'Analyst judged it legitimate' },
}

export const statusOf = (reviews, id) => reviews[id]?.status || 'pending'

export function recommendedAction(level) {
  if (level === 'high') return 'Review manually first. Several risk indicators fired together.'
  if (level === 'medium') return 'Review when high-priority items are done. Some indicators fired.'
  return 'No indicators fired strongly. Routine monitoring is enough.'
}

export function reviewSummary(rows, reviews) {
  const c = { pending: 0, escalated: 0, cleared: 0 }
  for (const r of rows) c[statusOf(reviews, r.transaction_id)]++
  const flagged = rows.filter((r) => r.risk.level !== 'low')
  const flaggedPending = flagged.filter((r) => statusOf(reviews, r.transaction_id) === 'pending').length
  return { ...c, flagged: flagged.length, flaggedPending }
}

const KEY = 'fraudguard.reviews.v1'

export function useReviews(scope) {
  // scope = dataset identity so uploading a different file does not reuse old decisions
  const key = `${KEY}:${scope}`
  const [reviews, setReviews] = useState({})

  useEffect(() => {
    try {
      setReviews(JSON.parse(localStorage.getItem(key) || '{}'))
    } catch {
      setReviews({})
    }
  }, [key])

  const setReview = useCallback(
    (id, status, note = '') => {
      setReviews((prev) => {
        const next = { ...prev }
        if (status === 'pending' && !note) delete next[id]
        else next[id] = { status, note, at: new Date().toISOString() }
        try { localStorage.setItem(key, JSON.stringify(next)) } catch { /* storage unavailable */ }
        return next
      })
    },
    [key],
  )
  return [reviews, setReview]
}
