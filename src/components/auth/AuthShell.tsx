import type { ReactNode } from 'react'
import { Activity, HeartPulse, Layers3, ShieldCheck } from 'lucide-react'
import { Logo } from '../brand/Logo'
import { CareIllustration } from './CareIllustration'

interface AuthShellProps {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
  headline: string
  body: string
  /** Wider form column for multi-section flows such as organisation registration. */
  wide?: boolean
}

const proofs = [
  { icon: ShieldCheck, title: 'Role-based access', detail: 'Scoped, audited, re-checked' },
  { icon: Activity, title: 'Live operations', detail: 'Beds, stock and staffing' },
  { icon: Layers3, title: 'One system', detail: 'Clinical, pharmacy, workforce' },
]

/**
 * Split authentication canvas: a soft clinical brand panel with a floating care
 * console, and a calm white form surface. Hairlines and typography carry the
 * structure; the only weight comes from the mark itself.
 */
export const AuthShell = ({
  eyebrow,
  title,
  description,
  children,
  footer,
  headline,
  body,
  wide = false,
}: AuthShellProps) => (
  <div className="min-h-screen bg-white lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,640px)]">
    <aside
      className="relative hidden overflow-hidden border-r border-border/70 px-8 py-9 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-between xl:px-12 xl:py-11"
      style={{
        backgroundImage:
          'radial-gradient(820px 520px at 10% 0%, #eef4ff 0%, transparent 56%), radial-gradient(760px 560px at 96% 96%, #fff0f5 0%, transparent 58%), linear-gradient(165deg, #ffffff 0%, #fdf8fa 100%)',
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage: 'radial-gradient(rgba(37,99,235,0.11) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(circle at 30% 20%, black 0%, transparent 68%)',
          WebkitMaskImage: 'radial-gradient(circle at 30% 20%, black 0%, transparent 68%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 top-1/3 h-72 w-72 rounded-full bg-blush-strong/60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 bottom-10 h-64 w-64 rounded-full bg-primary/[0.06] blur-3xl"
      />

      <div className="relative z-10 animate-auth-fade">
        <Logo size={34} />
      </div>

      <div className="relative z-10 my-auto w-full max-w-[430px] py-8 xl:mx-auto">
        <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.13em] text-primary">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/50 [animation-duration:2.6s]" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          Quiet clinical precision
        </p>

        <h1 className="mt-4 font-display text-[32px] font-semibold leading-[1.18] tracking-[-0.03em] text-text-primary xl:text-[38px]">
          {headline}
        </h1>
        <p className="mt-4 max-w-sm text-[13.5px] leading-6 text-text-secondary">{body}</p>

        <CareIllustration className="auth-illustration mt-7" />

        <ul className="mt-8 space-y-2">
          {proofs.map(({ icon: Icon, title: proofTitle, detail }) => (
            <li
              key={proofTitle}
              className="flex items-center gap-3 rounded-xl border border-white/90 bg-white/65 px-3 py-2.5 shadow-[0_10px_30px_-24px_rgba(16,24,40,0.35)] backdrop-blur-sm"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-white text-primary">
                <Icon size={13} />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-medium leading-tight text-text-primary">{proofTitle}</p>
                <p className="mt-0.5 text-[10.5px] leading-tight text-text-tertiary">{detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10 flex items-center justify-between gap-4 border-t border-border/80 pt-4">
        <p className="text-[10.5px] text-text-tertiary">© 2026 Ayush Seva Central · Internal use only</p>
        <p className="inline-flex items-center gap-1.5 rounded-full border border-mint-border bg-mint/80 px-2.5 py-1 text-[9.5px] font-medium text-mint-ink">
          <span className="h-1 w-1 rounded-full bg-emerald-500" />
          Systems ready
        </p>
      </div>
    </aside>

    <main className="relative flex min-h-screen flex-col px-5 py-7 sm:px-8 lg:px-8 lg:py-10 xl:px-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blush/90 blur-3xl" />
        <div className="absolute -bottom-28 -left-24 h-64 w-64 rounded-full bg-primary/[0.05] blur-3xl" />
      </div>

      <div className="relative z-10 flex items-center justify-between gap-4 lg:hidden">
        <Logo />
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1 text-[10px] font-medium text-text-tertiary">
          <ShieldCheck size={11} className="text-mint-ink" />
          Secure
        </span>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center py-8 lg:py-6">
        <div className={`w-full ${wide ? 'max-w-[600px]' : 'max-w-[420px]'}`}>
          <div className="animate-auth-rise relative rounded-2xl border border-border/80 bg-white p-6 shadow-[0_30px_70px_-50px_rgba(16,24,40,0.35)] sm:p-7">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-primary/35 to-transparent"
            />

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary-light text-primary">
                  <HeartPulse size={11} />
                </span>
                <p className="label-micro text-primary">{eyebrow}</p>
              </div>
              <span className="hidden items-center gap-1.5 rounded-full border border-border bg-bg-secondary/70 px-2.5 py-1 text-[10px] font-medium text-text-tertiary sm:inline-flex">
                <ShieldCheck size={11} className="text-mint-ink" />
                Encrypted
              </span>
            </div>

            <h2 className="mt-4 font-display text-[26px] font-semibold leading-8 tracking-[-0.03em] text-text-primary sm:text-[28px]">
              {title}
            </h2>
            <p className="mt-1.5 max-w-md text-[13px] leading-5 text-text-secondary">{description}</p>

            <div className="mt-7">{children}</div>

            <div className="mt-7 border-t border-border pt-5 text-center">{footer}</div>
          </div>

          <p className="mt-5 text-center text-[10.5px] text-text-tertiary lg:hidden">
            Protected workspace · ayushseva.org
          </p>
        </div>
      </div>

      <p className="relative z-10 hidden text-center text-[10.5px] text-text-tertiary lg:block">
        Protected workspace · ayushseva.org
      </p>
    </main>
  </div>
)
