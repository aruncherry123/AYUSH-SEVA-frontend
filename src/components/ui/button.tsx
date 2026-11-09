import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'subtle'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon'
  children: ReactNode
  loading?: boolean
}

const base =
  'inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-45'

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'bg-primary-light text-primary hover:bg-primary-border/70',
  outline: 'border border-border-strong bg-white text-text-primary hover:border-text-tertiary hover:bg-bg-secondary',
  ghost: 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary',
  danger: 'bg-error text-white hover:brightness-95',
  subtle: 'bg-bg-secondary text-text-primary hover:bg-primary-light hover:text-primary',
}

const sizes = {
  sm: 'h-8 px-3 text-xs rounded-md',
  md: 'h-9 px-3.5 text-[13px] rounded-lg',
  lg: 'h-10 px-4 text-sm rounded-lg',
  xl: 'h-11 px-5 text-sm rounded-lg',
  icon: 'h-9 w-9 rounded-lg',
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) => (
  <button
    className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    disabled={disabled || loading}
    {...props}
  >
    {loading && (
      <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    )}
    {children}
  </button>
)
