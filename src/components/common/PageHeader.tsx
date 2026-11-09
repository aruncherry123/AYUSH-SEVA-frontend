import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export type PageHeaderVariant = 'default' | 'compact' | 'hero' | 'banner'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  children?: ReactNode
  /** Visual identity of the page head. */
  variant?: PageHeaderVariant
  /** Small label above the title. */
  eyebrow?: string
  icon?: LucideIcon
  /** Inline metrics rendered inside hero/banner headers. */
  stats?: { label: string; value: ReactNode }[]
  className?: string
}

/**
 * Four page-header archetypes so screens do not all open the same way:
 * - default: quiet document header
 * - compact: editorial header with a rule below
 * - hero: dark command panel for executive screens
 * - banner: tinted context band for record pages
 */
export const PageHeader = ({
  title,
  description,
  actions,
  children,
  variant = 'default',
  eyebrow,
  icon: Icon,
  stats,
  className = '',
}: PageHeaderProps) => {
  if (variant === 'hero') {
    return (
      <div className={`relative overflow-hidden rounded-2xl bg-sidebar px-6 py-6 sm:px-8 sm:py-7 ${className}`}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(720px circle at 8% -10%, rgba(37,99,235,0.30), transparent 60%), radial-gradient(520px circle at 100% 120%, rgba(59,130,246,0.16), transparent 60%)',
          }}
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2.5 flex items-center gap-2.5">
              {Icon && (
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10 text-blue-200 ring-1 ring-white/10">
                  <Icon size={15} />
                </span>
              )}
              {eyebrow && <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-blue-200/80">{eyebrow}</p>}
            </div>
            <h1 className="text-[26px] font-semibold leading-8 tracking-[-0.025em] text-white sm:text-[30px] sm:leading-9">
              {title}
            </h1>
            {description && <p className="mt-2 max-w-2xl text-[13px] leading-5 text-white/55">{description}</p>}
            {stats && stats.length > 0 && (
              <div className="mt-6 flex flex-wrap items-center gap-x-10 gap-y-4">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="font-display text-[19px] font-semibold leading-6 tracking-tight text-white tabular-nums">{stat.value}</p>
                    <p className="mt-0.5 text-[11px] text-white/40">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </div>
    )
  }

  if (variant === 'banner') {
    return (
      <div className={`rounded-xl border border-border bg-surface-muted px-5 py-4 ${className}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3.5">
            {Icon && (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-white text-primary">
                <Icon size={17} />
              </span>
            )}
            <div className="min-w-0">
              {eyebrow && <p className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary">{eyebrow}</p>}
              <h1 className="font-display text-[17px] font-semibold leading-6 tracking-[-0.015em] text-text-primary">{title}</h1>
              {description && <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-5 text-text-secondary">{description}</p>}
            </div>
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={`flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between ${className}`}>
        <div className="min-w-0">
          {eyebrow && <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-text-tertiary">{eyebrow}</p>}
          <h1 className="font-display text-[22px] font-semibold leading-7 tracking-[-0.022em] text-text-primary">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-[13px] leading-5 text-text-secondary">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between ${className}`}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-text-tertiary">{eyebrow}</p>}
        <h1 className="font-display text-[22px] font-semibold leading-7 tracking-[-0.022em] text-text-primary">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-text-secondary">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      {children}
    </div>
  )
}
