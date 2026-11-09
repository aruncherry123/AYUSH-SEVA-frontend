import type { InputHTMLAttributes, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: ReactNode
  /** Interactive affordance rendered inside the field, such as a reveal toggle. */
  trailing?: ReactNode
  /** Larger field for focused flows such as authentication. */
  inputSize?: 'md' | 'lg'
}

export const Input = ({
  label,
  error,
  hint,
  icon,
  trailing,
  inputSize = 'md',
  className = '',
  id,
  ...props
}: InputProps) => {
  const inputId = id || props.name
  const left = icon ? (inputSize === 'lg' ? 'pl-10' : 'pl-9') : 'pl-3'
  const right = trailing ? 'pr-11' : 'pr-3'
  const height = inputSize === 'lg' ? 'h-11 text-[13.5px]' : 'h-9 text-[13px]'

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-medium text-text-primary">
          {label}
          {props.required && <span className="ml-0.5 text-error">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={`w-full rounded-lg border bg-white text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-primary focus:ring-[3px] focus:ring-primary/15 disabled:bg-bg-secondary disabled:text-text-secondary ${height} ${left} ${right} ${
            error ? 'border-error' : 'border-border-strong'
          } ${className}`}
          aria-invalid={!!error}
          {...props}
        />
        {trailing && <span className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</span>}
      </div>
      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
      {!error && hint && <p className="mt-1.5 text-xs text-text-secondary">{hint}</p>}
    </div>
  )
}
