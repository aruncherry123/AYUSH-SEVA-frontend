import { useId } from 'react'
import { BedDouble, HeartPulse, Pill, ShieldCheck, Users } from 'lucide-react'

/**
 * Decorative "care console" used on the auth brand panel. Built entirely from
 * CSS and SVG so it stays sharp, lightweight and themeable.
 */
export const CareIllustration = ({ className = '' }: { className?: string }) => {
  const rawId = useId()
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, '')
  const line = `care-line-${uid}`
  const area = `care-area-${uid}`

  return (
    <div className={`relative mx-auto w-full max-w-[330px] ${className}`} aria-hidden="true">
      {/* Soft orbit rings */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="animate-soft-pulse absolute h-[248px] w-[248px] rounded-full border border-primary-border/70" />
        <div className="absolute h-[196px] w-[196px] rounded-full border border-blush-border/80" />
        <div className="animate-orbit-spin absolute h-[286px] w-[286px] rounded-full border border-dashed border-border/80" />
        <span className="absolute left-[8%] top-[18%] h-1.5 w-1.5 rounded-full bg-primary/40" />
        <span className="absolute right-[10%] top-[30%] h-2 w-2 rounded-full bg-blush-ink/30" />
        <span className="absolute bottom-[12%] left-[16%] h-1.5 w-1.5 rounded-full bg-mint-ink/40" />
      </div>

      {/* Main tilted console */}
      <div className="relative px-2 py-7 [perspective:1200px]">
        <div className="animate-auth-sway relative rounded-[20px] border border-white/90 bg-white/80 p-4 shadow-[0_30px_70px_-30px_rgba(29,78,216,0.45)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary-light text-primary">
                <HeartPulse size={13} />
              </span>
              <div>
                <p className="font-display text-[11.5px] font-semibold leading-tight text-text-primary">Care overview</p>
                <p className="text-[9px] leading-tight text-text-tertiary">Live ward rhythm</p>
              </div>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-mint px-2 py-0.5 text-[9px] font-medium text-mint-ink">
              <span className="h-1 w-1 rounded-full bg-emerald-500" />
              Stable
            </span>
          </div>

          <svg viewBox="0 0 288 74" className="mt-3 h-[66px] w-full" fill="none">
            <defs>
              <linearGradient id={line} x1="0" y1="0" x2="288" y2="0" gradientUnits="userSpaceOnUse">
                <stop stopColor="#2563eb" />
                <stop offset="0.62" stopColor="#3b82f6" />
                <stop offset="1" stopColor="#fb7185" />
              </linearGradient>
              <linearGradient id={area} x1="144" y1="14" x2="144" y2="74" gradientUnits="userSpaceOnUse">
                <stop stopColor="#2563eb" stopOpacity="0.18" />
                <stop offset="1" stopColor="#2563eb" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[16, 34, 52].map((y) => (
              <line key={y} x1="0" y1={y} x2="288" y2={y} stroke="#e8edf6" strokeWidth="1" strokeDasharray="2 5" />
            ))}
            <path
              d="M0 44h26l7-1 5-13 7 26 6-32 6 22 5-6h24l8-10 8 24 6-28 5 14h20l6-2h22l7-14 8 28 6-24 5 10h30l6-2h26"
              stroke={`url(#${line})`}
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-ecg-draw"
            />
            <path
              d="M0 44h26l7-1 5-13 7 26 6-32 6 22 5-6h24l8-10 8 24 6-28 5 14h20l6-2h22l7-14 8 28 6-24 5 10h30l6-2h26V74H0Z"
              fill={`url(#${area})`}
            />
          </svg>

          <div className="mt-1 grid grid-cols-3 gap-2">
            {[
              { icon: BedDouble, value: '24', label: 'Beds ready' },
              { icon: Users, value: '38', label: 'On shift' },
              { icon: Pill, value: '98%', label: 'Meds on time' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="rounded-lg border border-border/80 bg-white/90 px-2 py-1.5">
                <span className="flex items-center gap-1 text-text-tertiary">
                  <Icon size={10} />
                  <span className="text-[8.5px] font-medium uppercase tracking-[0.05em]">{label}</span>
                </span>
                <p className="mt-0.5 font-display text-[14px] font-semibold leading-none text-text-primary tabular">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Floating chips */}
        <div className="animate-auth-float absolute -left-1 top-1 flex items-center gap-1.5 rounded-xl border border-white bg-white/95 px-2.5 py-1.5 shadow-[0_12px_30px_-12px_rgba(16,24,40,0.28)]">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blush-strong text-blush-ink">
            <HeartPulse size={11} />
          </span>
          <div>
            <p className="font-display text-[10.5px] font-semibold leading-none text-text-primary tabular">72 bpm</p>
            <p className="mt-0.5 text-[8.5px] leading-none text-text-tertiary">Resting pulse</p>
          </div>
        </div>

        <div
          className="animate-auth-float absolute -right-1 top-[38%] flex items-center gap-1.5 rounded-xl border border-white bg-white/95 px-2.5 py-1.5 shadow-[0_12px_30px_-12px_rgba(16,24,40,0.28)]"
          style={{ animationDelay: '1.4s' }}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-mint text-mint-ink">
            <ShieldCheck size={11} />
          </span>
          <div>
            <p className="font-display text-[10.5px] font-semibold leading-none text-text-primary">Role aware</p>
            <p className="mt-0.5 text-[8.5px] leading-none text-text-tertiary">Every action scoped</p>
          </div>
        </div>

        <div
          className="animate-auth-float absolute -bottom-1 left-[16%] flex items-center gap-1.5 rounded-xl border border-white bg-white/95 px-2.5 py-1.5 shadow-[0_12px_30px_-12px_rgba(16,24,40,0.28)]"
          style={{ animationDelay: '2.6s' }}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-light text-primary">
            <Pill size={11} />
          </span>
          <div>
            <p className="font-display text-[10.5px] font-semibold leading-none text-text-primary">Pharmacy synced</p>
            <p className="mt-0.5 text-[8.5px] leading-none text-text-tertiary">Stock to bedside</p>
          </div>
        </div>
      </div>
    </div>
  )
}
