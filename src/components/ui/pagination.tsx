import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  pageCount: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}

export const Pagination = ({ page, pageCount, total, pageSize, onPageChange }: PaginationProps) => {
  if (total === 0) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1,
  )

  return (
    <div className="flex flex-col items-center justify-between gap-3 py-3.5 sm:flex-row">
      <p className="text-xs text-text-tertiary">
        <span className="font-medium text-text-secondary">{from}–{to}</span> of{' '}
        <span className="font-medium text-text-secondary">{total}</span>
      </p>
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-secondary disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Previous page"
        >
          <ChevronLeft size={15} />
        </button>
        {pages.map((p, idx) => {
          const prev = pages[idx - 1]
          const gap = prev && p - prev > 1
          return (
            <span key={p} className="flex items-center">
              {gap && <span className="px-1 text-xs text-text-tertiary">…</span>}
              <button
                onClick={() => onPageChange(p)}
                className={`h-8 min-w-8 rounded-md px-2 text-xs font-medium transition-colors ${
                  p === page ? 'bg-primary-light text-primary' : 'text-text-secondary hover:bg-bg-secondary'
                }`}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </button>
            </span>
          )
        })}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === pageCount}
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-secondary disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Next page"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}
