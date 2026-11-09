import type { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = ({ label, error, hint, className = '', id, ...props }: TextareaProps) => {
  const textareaId = id || props.name
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-[13px] font-medium text-text-primary mb-1.5">
          {label}
          {props.required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`w-full px-3 py-2.5 border rounded-lg text-sm text-text-primary placeholder:text-text-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors resize-y min-h-[96px] ${
          error ? 'border-error' : 'border-border-strong'
        } ${className}`}
        aria-invalid={!!error}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
      {!error && hint && <p className="mt-1 text-xs text-text-secondary">{hint}</p>}
    </div>
  )
}
