import { useMemo, useState, type ReactNode } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Pagination } from './pagination'
import { EmptyState } from './states'

export interface Column<T> {
  key: string
  header: string
  sortable?: boolean
  align?: 'left' | 'right' | 'center'
  className?: string
  hideOnMobile?: boolean
  render?: (row: T) => ReactNode
  sortValue?: (row: T) => string | number
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  pageSize?: number
  emptyTitle?: string
  emptyDescription?: string
  actions?: (row: T) => ReactNode
  actionsHeader?: string
  /** Rows can be comfortable (default) or compact for dense ledgers. */
  density?: 'comfortable' | 'compact'
  striped?: boolean
}

function defaultSort<T>(row: T, key: string): string | number {
  const value = (row as Record<string, unknown>)[key]
  if (typeof value === 'number') return value
  return String(value ?? '')
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  pageSize = 8,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your search or filters.',
  actions,
  actionsHeader = '',
  density = 'comfortable',
  striped = false,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)

  const sorted = useMemo(() => {
    if (!sortKey) return rows
    const col = columns.find((c) => c.key === sortKey)
    const getter = col?.sortValue ?? ((row: T) => defaultSort(row, sortKey))
    return [...rows].sort((a, b) => {
      const av = getter(a)
      const bv = getter(b)
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [rows, sortKey, sortDir, columns])

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const paged = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const toggleSort = (col: Column<T>) => {
    if (!col.sortable) return
    if (sortKey === col.key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(col.key)
      setSortDir('asc')
    }
    setPage(1)
  }

  const isCompact = density === 'compact'
  const headCell = isCompact ? 'h-9 px-4' : 'h-10 px-4'
  const bodyCell = isCompact ? 'px-4 py-2.5' : 'px-4 py-3.5'

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface-muted">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`${headCell} text-[10.5px] font-semibold uppercase tracking-[0.07em] text-text-tertiary ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  } ${col.hideOnMobile ? 'hidden md:table-cell' : ''} ${col.className ?? ''}`}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => toggleSort(col)}
                      className={`inline-flex items-center gap-1 transition-colors hover:text-text-secondary ${
                        sortKey === col.key ? 'text-text-secondary' : ''
                      }`}
                    >
                      {col.header}
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                      ) : (
                        <ArrowUpDown size={12} className="opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
              {actions && <th className={`${headCell} w-10`} aria-label={actionsHeader || 'Actions'} />}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, rowIndex) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`group border-b border-border/80 transition-colors last:border-0 ${
                  striped && rowIndex % 2 === 1 ? 'bg-surface-muted/60' : ''
                } ${onRowClick ? 'cursor-pointer' : ''} hover:bg-[#fafbfc]`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`${bodyCell} align-middle text-[13px] text-text-primary ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    } ${col.hideOnMobile ? 'hidden md:table-cell' : ''} ${col.className ?? ''}`}
                  >
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                  </td>
                ))}
                {actions && (
                  <td className={`${bodyCell} text-right`} onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-0.5 opacity-70 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      {actions(row)}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 sm:px-5">
        <Pagination
          page={currentPage}
          pageCount={pageCount}
          total={sorted.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
