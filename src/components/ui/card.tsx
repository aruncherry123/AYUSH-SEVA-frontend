import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

/** A panel on the canvas: hairline border, no shadow, generous padding rhythm. */
export const Card = ({ children, className = '' }: CardProps) => (
  <div className={`rounded-xl border border-border bg-white ${className}`}>{children}</div>
)

export const CardHeader = ({
  children,
  className = '',
  action,
}: {
  children: ReactNode
  className?: string
  action?: ReactNode
}) => (
  <div className={`flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6 ${className}`}>
    <div className="min-w-0">{children}</div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
)

export const CardTitle = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <h3 className={`text-[15px] font-semibold leading-6 tracking-[-0.01em] text-text-primary ${className}`}>{children}</h3>
)

export const CardDescription = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <p className={`mt-0.5 text-[13px] leading-5 text-text-secondary ${className}`}>{children}</p>
)

export const CardContent = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`px-5 py-5 sm:px-6 ${className}`}>{children}</div>
)
