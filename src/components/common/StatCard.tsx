import type { LucideIcon } from 'lucide-react'

type Accent = 'pink' | 'green' | 'amber' | 'blue' | 'red' | 'purple'
export type StatCardVariant = 'default' | 'tile' | 'accent' | 'inverse'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  delta?: string
  trend?: 'up' | 'down' | 'flat'
  hint?: string
  accent?: Accent
  variant?: StatCardVariant
}

const trendColor: Record<string, string> = {
  up: 'text-success',
  down: 'text-error',
  flat: 'text-text-tertiary',
}

const tone: Record<Accent, string> = {
  pink: 'text-primary',
  blue: 'text-[#175cd3]',
  green: 'text-[#027a48]',
  amber: 'text-[#b54708]',
  red: 'text-[#b42318]',
  purple: 'text-[#5925dc]',
}

/**
 * Metrics are intentionally quiet: one number, one label, one optional note.
 * Colour appears only on the delta or the icon, never as a full tinted panel.
 */
export const StatCard = ({
  label,
  value,
  icon: Icon,
  delta,
  trend = 'flat',
  hint,
  accent = 'pink',
  variant = 'default',
}: StatCardProps) => {
  if (variant === 'inverse') {
    return (
      <div className="rounded-xl bg-sidebar px-5 py-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11.5px] font-medium text-white/45">{label}</p>
          <Icon size={15} className="shrink-0 text-white/30" />
        </div>
        <p className="mt-2 font-display text-[26px] font-semibold leading-8 tracking-[-0.03em] tabular-nums">{value}</p>
        {(delta || hint) && (
          <div className="mt-1.5 flex items-center gap-2 text-[11.5px]">
            {delta && (
              <span className={trend === 'down' ? 'text-red-300' : trend === 'up' ? 'text-emerald-300' : 'text-white/50'}>
                {delta}
              </span>
            )}
            {hint && <span className="truncate text-white/35">{hint}</span>}
          </div>
        )}
      </div>
    )
  }

  if (variant === 'tile') {
    return (
      <div className="rounded-lg bg-bg-secondary px-4 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] font-medium text-text-secondary">{label}</p>
          <Icon size={14} className="text-text-tertiary" />
        </div>
        <p className="mt-1.5 font-display text-[22px] font-semibold leading-7 tracking-[-0.025em] text-text-primary tabular-nums">{value}</p>
        {(delta || hint) && (
          <div className="mt-1 flex items-center gap-1.5 text-[11px]">
            {delta && <span className={`font-medium ${trendColor[trend]}`}>{delta}</span>}
            {hint && <span className="truncate text-text-tertiary">{hint}</span>}
          </div>
        )}
      </div>
    )
  }

  if (variant === 'accent') {
    return (
      <div className="border-l-2 border-primary-border px-5 py-1">
        <div className="flex items-center gap-2">
          <Icon size={14} className={tone[accent] ?? 'text-primary'} />
          <p className="text-[12px] font-medium text-text-secondary">{label}</p>
        </div>
        <p className="mt-1.5 font-display text-[24px] font-semibold leading-7 tracking-[-0.025em] text-text-primary tabular-nums">{value}</p>
        {(delta || hint) && (
          <div className="mt-1 flex items-center gap-2 text-[11px]">
            {delta && <span className={`font-medium ${trendColor[trend]}`}>{delta}</span>}
            {hint && <span className="truncate text-text-tertiary">{hint}</span>}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-medium text-text-secondary">{label}</p>
        <Icon size={15} className={`shrink-0 ${tone[accent] ?? 'text-primary'} opacity-80`} />
      </div>
      <p className="mt-1.5 font-display text-[26px] font-semibold leading-8 tracking-[-0.03em] text-text-primary tabular-nums">{value}</p>
      {(delta || hint) && (
        <div className="mt-1.5 flex items-center gap-2 text-[11.5px]">
          {delta && <span className={`font-medium ${trendColor[trend]}`}>{delta}</span>}
          {hint && <span className="truncate text-text-tertiary">{hint}</span>}
        </div>
      )}
    </div>
  )
}
