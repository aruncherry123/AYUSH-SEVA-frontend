import type { ReactNode } from 'react'
import { Inbox, Loader2, AlertCircle } from 'lucide-react'

export const EmptyState = ({
  title,
  description,
  icon,
  action,
}: {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}) => (
  <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-bg-secondary text-text-tertiary">
      {icon ?? <Inbox size={19} />}
    </div>
    <p className="text-[13.5px] font-semibold text-text-primary">{title}</p>
    {description && <p className="mt-1 max-w-sm text-[12.5px] leading-5 text-text-secondary">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
)

export const LoadingState = ({ label = 'Loading…' }: { label?: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
    <Loader2 className="mb-3 animate-spin text-primary" size={22} />
    <p className="text-[13px]">{label}</p>
  </div>
)

export const ErrorState = ({ title = 'Something went wrong', description, action }: { title?: string; description?: string; action?: ReactNode }) => (
  <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#fef3f2] text-error">
      <AlertCircle size={19} />
    </div>
    <p className="text-[13.5px] font-semibold text-text-primary">{title}</p>
    {description && <p className="mt-1 max-w-sm text-[12.5px] leading-5 text-text-secondary">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
)

export const SkeletonRow = ({ cols }: { cols: number }) => (
  <tr className="border-b border-border">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3.5">
        <div className="h-3.5 animate-pulse rounded bg-bg-secondary" />
      </td>
    ))}
  </tr>
)
