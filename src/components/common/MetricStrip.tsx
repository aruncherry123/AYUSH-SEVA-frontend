import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

export interface MetricItem {
  label: string
  value: ReactNode
  note?: string
  icon?: LucideIcon
  /** Optional path — turns the metric into a link. */
  to?: string
  /** Optional tone for the icon only. */
  tone?: string
}

const columnClass: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-2 lg:grid-cols-5',
}

/**
 * A single hairline-divided row of metrics. Deliberately quiet: one number,
 * one label, one optional note — no tinted panels or accent bars.
 */
export const MetricStrip = ({
  items,
  columns = 4,
  className = '',
}: {
  items: MetricItem[]
  columns?: 2 | 3 | 4 | 5
  className?: string
}) => (
  <div className={`grid gap-px overflow-hidden rounded-xl border border-border bg-border ${columnClass[columns]} ${className}`}>
    {items.map((item) => {
      const Icon = item.icon
      const body = (
        <>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12px] font-medium text-text-secondary">{item.label}</p>
            {Icon && <Icon size={14} className={item.tone ?? 'text-text-tertiary'} />}
          </div>
          <p className="mt-2 font-display text-[24px] font-semibold leading-7 tracking-[-0.03em] text-text-primary tabular-nums">
            {item.value}
          </p>
          {item.note && <p className="mt-0.5 truncate text-[11.5px] text-text-tertiary">{item.note}</p>}
        </>
      )
      const shell = 'block bg-white px-5 py-4'
      return item.to ? (
        <Link key={item.label} to={item.to} className={`${shell} transition-colors hover:bg-surface-muted`}>
          {body}
        </Link>
      ) : (
        <div key={item.label} className={shell}>
          {body}
        </div>
      )
    })}
  </div>
)
