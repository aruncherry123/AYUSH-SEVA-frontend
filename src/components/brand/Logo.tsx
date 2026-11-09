import { useId } from 'react'

interface LogoMarkProps {
  /** Pixel size of the square mark. */
  size?: number
  className?: string
}

/**
 * Ayush Seva mark — a soft-cornered care tile holding a rounded medical cross
 * that carries a heartbeat line. The pulse breaks past the cross so the mark
 * reads as "care in motion" rather than a static generic plus.
 */
export const LogoMark = ({ size = 32, className = '' }: LogoMarkProps) => {
  const rawId = useId()
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, '')
  const tile = `seva-tile-${uid}`
  const gloss = `seva-gloss-${uid}`
  const pulse = `seva-pulse-${uid}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <linearGradient id={tile} x1="6" y1="1" x2="43" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1d4ed8" />
          <stop offset="0.52" stopColor="#2563eb" />
          <stop offset="1" stopColor="#0e7490" />
        </linearGradient>
        <linearGradient id={gloss} x1="24" y1="1" x2="24" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={pulse} x1="10" y1="24" x2="38" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffe4ee" />
          <stop offset="0.45" stopColor="#fda4af" />
          <stop offset="1" stopColor="#fb7185" />
        </linearGradient>
      </defs>

      <rect x="1" y="1" width="46" height="46" rx="14" fill={`url(#${tile})`} />
      <rect x="1" y="1" width="46" height="46" rx="14" fill={`url(#${gloss})`} />
      <rect
        x="2.25"
        y="2.25"
        width="43.5"
        height="43.5"
        rx="12.75"
        stroke="#ffffff"
        strokeOpacity="0.18"
        strokeWidth="1.1"
      />

      {/* Medical cross */}
      <rect x="19.4" y="9.6" width="9.2" height="28.8" rx="4.6" fill="#ffffff" />
      <rect x="9.6" y="19.4" width="28.8" height="9.2" rx="4.6" fill="#ffffff" />

      {/* Heartbeat carried across the cross */}
      <path
        d="M8.4 24h6.1l2.5-5.2 4 10.6 3.2-7.1 2.1 1.7h13.3"
        stroke={`url(#${pulse})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface LogoProps {
  size?: number
  /** `dark` for white canvases, `light` for the ink sidebar. */
  tone?: 'dark' | 'light'
  showTagline?: boolean
  className?: string
}

/** Full lockup: mark + Ayush Seva wordmark. */
export const Logo = ({ size = 32, tone = 'dark', showTagline = true, className = '' }: LogoProps) => (
  <div className={`flex min-w-0 items-center gap-2.5 ${className}`}>
    <LogoMark size={size} className="shrink-0" />
    <div className="min-w-0">
      <p
        className={`font-display text-[15px] font-semibold leading-tight tracking-[-0.015em] ${
          tone === 'light' ? 'text-white' : 'text-text-primary'
        }`}
      >
        Ayush Seva
      </p>
      {showTagline && (
        <p className={`text-[10.5px] leading-tight ${tone === 'light' ? 'text-sidebar-text/75' : 'text-text-tertiary'}`}>
          Hospital Operations
        </p>
      )}
    </div>
  </div>
)
