interface ProgressProps {
  value: number
  className?: string
  tone?: 'primary' | 'success' | 'warning' | 'error'
}

const tones = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
}

export const Progress = ({ value, className = '', tone = 'primary' }: ProgressProps) => {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className={`h-2 w-full bg-bg-secondary rounded-full overflow-hidden ${className}`} role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-all ${tones[tone]}`} style={{ width: `${clamped}%` }} />
    </div>
  )
}
