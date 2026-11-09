import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export interface TabItem {
  id: string
  label: string
  count?: number
  icon?: LucideIcon
}

export type TabsVariant = 'underline' | 'segmented' | 'boxed' | 'pills'

interface TabsProps {
  tabs: TabItem[]
  active: string
  onChange: (id: string) => void
  variant?: TabsVariant
  className?: string
  right?: ReactNode
  ariaLabel?: string
}

const tabBase =
  'relative inline-flex items-center gap-2 whitespace-nowrap text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20'

const countBase = 'inline-flex min-w-[18px] justify-center rounded px-1 py-0.5 text-[10.5px] font-semibold leading-none tabular-nums'

/**
 * Four tab personalities:
 * - underline: editorial tabs for record/detail views
 * - segmented: control for switching views or filters
 * - boxed: contained folder tabs for settings groups
 * - pills: standalone chips for board/section switches
 */
export const Tabs = ({ tabs, active, onChange, variant = 'underline', className = '', right, ariaLabel }: TabsProps) => {
  if (variant === 'segmented') {
    return (
      <div className={`flex flex-wrap items-center justify-between gap-3 ${className}`}>
        <div
          role="tablist"
          aria-label={ariaLabel}
          className="inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg border border-border bg-white p-0.5 no-scrollbar"
        >
          {tabs.map((tab) => {
            const isActive = tab.id === active
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(tab.id)}
                className={`${tabBase} rounded-md px-3 py-1.5 ${
                  isActive ? 'bg-bg-secondary text-text-primary' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {Icon && <Icon size={14} className={isActive ? 'text-primary' : 'text-text-tertiary'} />}
                {tab.label}
                {typeof tab.count === 'number' && (
                  <span className={`${countBase} ${isActive ? 'bg-primary-light text-primary' : 'bg-bg-secondary text-text-tertiary'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {right}
      </div>
    )
  }

  if (variant === 'boxed') {
    return (
      <div className={`flex items-end justify-between gap-3 ${className}`}>
        <div role="tablist" aria-label={ariaLabel} className="flex gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = tab.id === active
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(tab.id)}
                className={`${tabBase} rounded-lg px-3.5 py-2 ${
                  isActive ? 'bg-text-primary text-white' : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                }`}
              >
                {Icon && <Icon size={14} />}
                {tab.label}
                {typeof tab.count === 'number' && (
                  <span className={`${countBase} ${isActive ? 'bg-white/15 text-white' : 'bg-bg-secondary text-text-tertiary'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {right}
      </div>
    )
  }

  if (variant === 'pills') {
    return (
      <div className={`flex items-center justify-between gap-3 ${className}`}>
        <div role="tablist" aria-label={ariaLabel} className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {tabs.map((tab) => {
            const isActive = tab.id === active
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(tab.id)}
                className={`${tabBase} rounded-md px-3 py-1.5 ${
                  isActive
                    ? 'bg-primary-light text-primary'
                    : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                }`}
              >
                {Icon && <Icon size={14} />}
                {tab.label}
                {typeof tab.count === 'number' && (
                  <span className={`${countBase} ${isActive ? 'bg-primary/10 text-primary' : 'bg-bg-secondary text-text-tertiary'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {right}
      </div>
    )
  }

  // underline (default)
  return (
    <div className={`flex items-center justify-between gap-3 border-b border-border ${className}`}>
      <div role="tablist" aria-label={ariaLabel} className="flex gap-5 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = tab.id === active
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`${tabBase} py-3 ${isActive ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
              {Icon && <Icon size={14} className={isActive ? 'text-primary' : 'text-text-tertiary'} />}
              {tab.label}
              {typeof tab.count === 'number' && (
                <span className={`${countBase} ${isActive ? 'bg-primary-light text-primary' : 'bg-bg-secondary text-text-tertiary'}`}>
                  {tab.count}
                </span>
              )}
              <span
                className={`absolute inset-x-0 -bottom-px h-[2px] bg-primary transition-opacity ${
                  isActive ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </button>
          )
        })}
      </div>
      {right}
    </div>
  )
}

export interface SideTab {
  id: string
  label: string
  icon?: LucideIcon
  hint?: string
}

interface SideTabsProps {
  tabs: SideTab[]
  active: string
  onChange: (id: string) => void
  className?: string
  ariaLabel?: string
}

/** Vertical navigation tabs used on settings-style pages. */
export const SideTabs = ({ tabs, active, onChange, className = '', ariaLabel }: SideTabsProps) => (
  <nav role="tablist" aria-label={ariaLabel} className={`flex gap-1 overflow-x-auto no-scrollbar lg:flex-col ${className}`}>
    {tabs.map((tab) => {
      const isActive = tab.id === active
      const Icon = tab.icon
      return (
        <button
          key={tab.id}
          role="tab"
          aria-selected={isActive}
          onClick={() => onChange(tab.id)}
          className={`relative flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-medium transition-colors lg:w-full ${
            isActive ? 'bg-primary-light text-primary' : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
          }`}
        >
          {Icon && <Icon size={16} className={`shrink-0 ${isActive ? 'text-primary' : 'text-text-tertiary'}`} />}
          <span className="truncate">{tab.label}</span>
          {tab.hint && <span className="ml-auto hidden text-[11px] font-normal text-text-tertiary lg:block">{tab.hint}</span>}
        </button>
      )
    })}
  </nav>
)
