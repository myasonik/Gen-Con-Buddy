import { useState, useEffect } from 'react'

const PAGE_SIZE_OPTIONS = [100, 500, 1000] as const
const BACKEND_MAX_RESULTS = 10_000

function Toggletip({ label, message }: { label: string; message: string }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <button type="button" aria-label={label} onClick={() => setOpen(o => !o)}>?</button>
      {open && <span role="tooltip" style={{ position: 'absolute', zIndex: 1 }}>{message}</span>}
    </span>
  )
}

function getPageNumbers(page: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  if (page > 3) pages.push('...')
  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (page < totalPages - 2) pages.push('...')
  pages.push(totalPages)
  return pages
}

interface PaginationProps {
  page: number
  limit: number
  total: number
  onNavigate: (page: number, limit: number) => void
}

export function Pagination({ page, limit, total, onNavigate }: PaginationProps) {
  const naturalTotalPages = Math.ceil(total / limit)
  const maxPages = Math.floor(BACKEND_MAX_RESULTS / limit)
  const totalPages = Math.min(naturalTotalPages, maxPages)
  const isTruncated = naturalTotalPages > maxPages
  const pageNumbers = getPageNumbers(page, totalPages)

  return (
    <nav aria-label="Pagination">
      <button
        type="button"
        onClick={() => onNavigate(page - 1, limit)}
        disabled={page === 1}
      >
        Previous
      </button>
      <span>Page {page} of {totalPages}</span>
      {isTruncated && (
        <Toggletip
          label="Why are some pages unavailable?"
          message={`Results are capped at ${BACKEND_MAX_RESULTS.toLocaleString()} events. Narrow your search to see more.`}
        />
      )}
      {pageNumbers.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} aria-hidden>…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onNavigate(p, limit)}
            aria-current={p === page ? 'page' : undefined}
            disabled={p === page}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onNavigate(page + 1, limit)}
        disabled={page === totalPages}
      >
        Next
      </button>
      <label>
        Per page
        <select
          value={limit}
          onChange={(e) => onNavigate(1, Number(e.target.value))}
        >
          {PAGE_SIZE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </label>
    </nav>
  )
}
