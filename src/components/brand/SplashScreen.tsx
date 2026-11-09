import { useEffect, useRef, useState } from 'react'
import { HeartPulse, Pill, Plus, ShieldCheck } from 'lucide-react'

interface SplashScreenProps {
  /** Called once the exit transition has finished. */
  onComplete: () => void
}

const sparks = [
  { Icon: Plus, className: 'left-[13%] top-[18%] h-10 w-10 rotate-[-10deg] text-primary/50', delay: '0s' },
  { Icon: Plus, className: 'right-[15%] top-[26%] h-9 w-9 rotate-[12deg] text-blush-ink/60', delay: '0.9s' },
  { Icon: Plus, className: 'bottom-[26%] left-[19%] h-7 w-7 rotate-[16deg] text-mint-ink/50', delay: '1.8s' },
  { Icon: HeartPulse, className: 'bottom-[20%] right-[18%] h-8 w-8 rotate-[-6deg] text-primary/40', delay: '1.3s' },
]

/**
 * Full-viewport launch scene: a floating 3D care cube with orbiting rings,
 * parallax satellite tiles, a drifting perspective floor and soft clinical
 * blooms. It holds for a beat and zooms/fades into the workspace underneath.
 */
export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [leaving, setLeaving] = useState(false)
  const complete = useRef(onComplete)

  useEffect(() => {
    complete.current = onComplete
  }, [onComplete])

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const hold = reduced ? 700 : 2250
    const exit = reduced ? 20 : 520

    const holdTimer = window.setTimeout(() => setLeaving(true), hold)
    const doneTimer = window.setTimeout(() => complete.current(), hold + exit)

    return () => {
      window.clearTimeout(holdTimer)
      window.clearTimeout(doneTimer)
    }
  }, [])

  useEffect(() => {
    const html = document.documentElement
    const previousHtml = html.style.overflow
    const previousBody = document.body.style.overflow
    html.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = previousHtml
      document.body.style.overflow = previousBody
    }
  }, [])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading Ayush Seva"
      className={`fixed inset-0 z-[9999] h-[100dvh] w-screen overflow-hidden bg-white ${
        leaving ? 'animate-splash-out' : ''
      }`}
      style={{
        backgroundImage:
          'radial-gradient(1100px 720px at 16% 4%, #e8f1ff 0%, transparent 58%), radial-gradient(900px 640px at 88% 98%, #ffeaf2 0%, transparent 60%), radial-gradient(680px 520px at 78% 12%, #eafaf6 0%, transparent 62%), linear-gradient(180deg, #ffffff 0%, #f8fbff 52%, #fff7fa 100%)',
      }}
    >
      {/* The scene fades in over an already opaque, full-viewport surface. */}
      <div
        className={`absolute inset-0 flex items-center justify-center overflow-hidden ${
          leaving ? '' : 'animate-splash-in'
        }`}
      >
        {/* Quiet dot grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(rgba(37,99,235,0.16) 1px, transparent 1px)',
            backgroundSize: '26px 26px',
            maskImage: 'radial-gradient(circle at 50% 42%, black 0%, transparent 74%)',
            WebkitMaskImage: 'radial-gradient(circle at 50% 42%, black 0%, transparent 74%)',
          }}
        />

        {/* Ambient blooms */}
        <div aria-hidden="true" className="animate-splash-drift pointer-events-none absolute -left-20 top-[12%] h-[26rem] w-[26rem] rounded-full bg-primary/10 blur-3xl" />
        <div
          aria-hidden="true"
          className="animate-splash-drift pointer-events-none absolute -right-24 bottom-[10%] h-[30rem] w-[30rem] rounded-full bg-blush-strong/60 blur-3xl"
          style={{ animationDelay: '-3.5s' }}
        />
        <div
          aria-hidden="true"
          className="animate-splash-drift pointer-events-none absolute right-[24%] top-[-6%] h-72 w-72 rounded-full bg-teal-300/20 blur-3xl"
          style={{ animationDelay: '-6s' }}
        />

        {/* Soft light streaks */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-1/4 top-[-10%] h-[120%] w-1/3 rotate-[16deg] bg-linear-to-b from-primary/10 via-transparent to-transparent blur-2xl" />
          <div className="absolute right-[-6%] top-[18%] h-[74%] w-1/4 -rotate-[14deg] bg-linear-to-b from-blush-strong/45 via-transparent to-transparent blur-2xl" />
        </div>

        {/* Perspective floor */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[40vh] overflow-hidden [perspective:520px]">
          <div
            className="splash-grid absolute inset-x-[-45%] bottom-[-14%] h-[130%] origin-bottom opacity-40 [transform:rotateX(66deg)]"
            style={{
              maskImage: 'linear-gradient(to top, black 0%, transparent 76%)',
              WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 76%)',
            }}
          />
        </div>

        {/* Floating medical sparks */}
        {sparks.map(({ Icon, className, delay }, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={`animate-splash-spark absolute hidden items-center justify-center rounded-2xl border border-border bg-white/70 shadow-sm backdrop-blur-sm sm:flex ${className}`}
            style={{ animationDelay: delay }}
          >
            <Icon size={15} />
          </span>
        ))}

        <div className="relative z-10 flex w-full max-w-md flex-col items-center px-6 text-center">
          {/* 3D stage */}
          <div className="splash-stage relative mb-7 flex h-[248px] w-[300px] items-center justify-center sm:h-[268px] sm:w-[340px]">
            <span aria-hidden="true" className="animate-splash-glow absolute h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
            <span aria-hidden="true" className="absolute h-36 w-36 rounded-full bg-teal-300/20 blur-2xl" />
            <span aria-hidden="true" className="splash-ring3d splash-ring3d-b" />
            <span aria-hidden="true" className="splash-ring3d splash-ring3d-a" />
            <span aria-hidden="true" className="absolute bottom-6 h-7 w-44 rounded-[50%] bg-primary/15 blur-xl" />

            {/* Parallax satellite tiles */}
            <div aria-hidden="true" className="absolute left-0 top-10 [transform:translateZ(70px)]">
              <div className="animate-splash-float flex h-10 w-10 items-center justify-center rounded-xl border border-white bg-white/85 text-blush-ink shadow-[0_18px_40px_-20px_rgba(16,24,40,0.45)] backdrop-blur-sm">
                <HeartPulse size={16} />
              </div>
            </div>
            <div aria-hidden="true" className="absolute right-1 top-5 [transform:translateZ(30px)]">
              <div
                className="animate-splash-float flex h-9 w-9 items-center justify-center rounded-xl border border-white bg-white/85 text-mint-ink shadow-[0_18px_40px_-20px_rgba(16,24,40,0.45)] backdrop-blur-sm"
                style={{ animationDelay: '1.1s' }}
              >
                <ShieldCheck size={15} />
              </div>
            </div>
            <div aria-hidden="true" className="absolute bottom-9 left-2 [transform:translateZ(50px)]">
              <div
                className="animate-splash-float flex h-9 w-9 items-center justify-center rounded-xl border border-white bg-white/85 text-primary shadow-[0_18px_40px_-20px_rgba(16,24,40,0.45)] backdrop-blur-sm"
                style={{ animationDelay: '2.1s' }}
              >
                <Pill size={15} />
              </div>
            </div>
            <div aria-hidden="true" className="absolute bottom-5 right-3 [transform:translateZ(100px)]">
              <div
                className="animate-splash-float flex h-8 w-8 items-center justify-center rounded-lg border border-white bg-white/85 text-primary shadow-[0_18px_40px_-20px_rgba(16,24,40,0.45)] backdrop-blur-sm"
                style={{ animationDelay: '0.6s' }}
              >
                <Plus size={14} />
              </div>
            </div>

            {/* Care cube */}
            <div className="splash-cube-hover relative">
              <div className="splash-cube">
                <span aria-hidden="true" className="absolute inset-[16%] rounded-[18px] bg-primary/25 blur-[6px]" />
                <span className="splash-face splash-face-front">
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="relative block h-[58%] w-[58%]">
                      <span className="absolute left-1/2 top-0 h-full w-[27%] -translate-x-1/2 rounded-full bg-white/95" />
                      <span className="absolute left-0 top-1/2 h-[27%] w-full -translate-y-1/2 rounded-full bg-white/95" />
                      <svg viewBox="0 0 48 48" fill="none" className="absolute inset-0 h-full w-full">
                        <path
                          d="M1 24h9.5l3.4-6.8 5.4 14.6 4.4-9.7 2.9 1.9H47"
                          stroke="#ffe4ee"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </span>
                  <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-white/25 to-transparent" />
                </span>
                <span className="splash-face splash-face-right" />
                <span className="splash-face splash-face-left" />
                <span className="splash-face splash-face-top" />
                <span className="splash-face splash-face-bottom" />
                <span className="splash-face splash-face-back" />
              </div>
            </div>
          </div>

          <div className="animate-splash-enter" style={{ animationDelay: '120ms' }}>
            <p className="inline-flex items-center gap-1.5 rounded-full border border-primary-border/70 bg-white/70 px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-primary backdrop-blur-sm">
              <span className="h-1 w-1 rounded-full bg-primary" />
              Hospital operations
            </p>
            <h1 className="mt-4 font-display text-[30px] font-semibold leading-none tracking-[-0.03em] text-text-primary sm:text-[34px]">
              Ayush Seva
            </h1>
            <p className="mt-2.5 text-[12.5px] font-medium tracking-[0.02em] text-text-secondary">Care, coordinated.</p>
          </div>

          <div className="animate-splash-enter mt-8 w-full" style={{ animationDelay: '260ms' }}>
            <div className="relative mx-auto h-1 w-56 overflow-hidden rounded-full bg-primary/10">
              <div className="animate-splash-progress h-full w-full rounded-full bg-linear-to-r from-primary via-blue-400 to-blush-ink" />
              <div className="animate-splash-shimmer absolute inset-y-0 -left-16 w-16 bg-white/60 blur-md" />
            </div>
            <p className="mt-3 flex items-center justify-center gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-text-tertiary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/70" />
              Preparing your workspace
            </p>
          </div>
        </div>

        <p className="absolute inset-x-0 bottom-7 text-center text-[10.5px] tracking-[0.02em] text-text-tertiary">
          © 2026 Ayush Seva · ayushseva.org
        </p>
      </div>
    </div>
  )
}
