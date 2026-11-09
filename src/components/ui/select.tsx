import { Children, isValidElement, useId, useMemo, useState, type ReactNode, type SelectHTMLAttributes } from 'react'
import type { ChangeEvent } from 'react'
import { Dropdown, type DropdownOption } from './dropdown'

interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children' | 'value' | 'defaultValue' | 'onChange'> {
  label?: string
  error?: string
  hint?: string
  children: ReactNode
  value?: string | number
  defaultValue?: string | number
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void
}

function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children)
  return ''
}

function parseOptions(children: ReactNode): DropdownOption[] {
  const options: DropdownOption[] = []
  Children.forEach(children, (child) => {
    if (!isValidElement(child) || child.type !== 'option') return
    const props = child.props as { value?: string | number; children?: ReactNode; disabled?: boolean }
    const label = textOf(props.children)
    options.push({
      value: props.value !== undefined ? String(props.value) : label,
      label,
      disabled: props.disabled,
    })
  })
  return options
}

/**
 * Styled select: same API as a native <select> (option children, value /
 * defaultValue, onChange event, name) but rendered as an elegant listbox.
 */
export const Select = ({
  label,
  error,
  hint,
  className = '',
  children,
  id,
  value,
  defaultValue,
  onChange,
  name,
  required,
  disabled,
  ...props
}: SelectProps) => {
  const autoId = useId()
  const selectId = id || `${autoId}-select`

  const options = useMemo(() => parseOptions(children), [children])

  const isControlled = value !== undefined
  const [internal, setInternal] = useState<string>(() =>
    value !== undefined
      ? String(value)
      : defaultValue !== undefined
        ? String(defaultValue)
        : (options[0]?.value ?? ''),
  )
  const current = isControlled ? String(value) : internal

  const handleChange = (next: string) => {
    if (!isControlled) setInternal(next)
    onChange?.({ target: { value: next } } as unknown as ChangeEvent<HTMLSelectElement>)
  }

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={selectId} className="block text-[13px] font-medium text-text-primary mb-1.5">
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}
      <Dropdown
        id={selectId}
        options={options}
        value={current}
        onChange={handleChange}
        disabled={disabled}
        ariaLabel={props['aria-label']}
        menuMinWidth={0}
        triggerClassName={`flex h-9 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 text-[13px] outline-none transition-colors focus:ring-[3px] focus:ring-primary/15 ${
          disabled
            ? 'cursor-not-allowed border-border bg-bg-secondary text-text-secondary'
            : error
              ? 'border-error text-text-primary'
              : 'border-border-strong text-text-primary hover:border-primary-border focus:border-primary'
        }`}
      />
      {name && <input type="hidden" name={name} value={current} readOnly />}
      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
      {!error && hint && <p className="mt-1.5 text-xs text-text-secondary">{hint}</p>}
    </div>
  )
}
