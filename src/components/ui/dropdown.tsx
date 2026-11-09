import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'

export interface DropdownOption {
  value: string
  label: string
  disabled?: boolean
}

interface DropdownProps {
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  ariaLabel?: string
  id?: string
  /** Custom trigger content. Receives the current open state. */
  trigger?: (state: { open: boolean }) => ReactNode
  triggerClassName?: string
  /** Minimum width of the floating panel in px. */
  menuMinWidth?: number
}

/**
 * Shared dropdown engine: a portal-rendered listbox so menus are never clipped
 * by scrollable modals/drawers, with keyboard navigation, viewport-aware
 * placement and a polished selected/hover state.
 */
export function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  disabled = false,
  ariaLabel,
  id,
  trigger,
  triggerClassName = '',
  menuMinWidth = 0,
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [pos, setPos] = useState<{
    left: number
    width: number
    maxHeight: number
    top?: number
    bottom?: number
  } | null>(null)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)
  const selectedIndex = options.findIndex((o) => o.value === value)

  const measure = () => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const gap = 6
    const spaceBelow = window.innerHeight - rect.bottom - gap - 8
    const spaceAbove = rect.top - gap - 8
    const openUp = spaceBelow < 180 && spaceAbove > spaceBelow
    const width = Math.max(rect.width, menuMinWidth)
    setPos({
      left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
      width,
      maxHeight: Math.min(288, Math.max(120, openUp ? spaceAbove : spaceBelow)),
      ...(openUp ? { bottom: window.innerHeight - rect.top + gap } : { top: rect.bottom + gap }),
    })
  }

  useLayoutEffect(() => {
    if (!open) return
    measure()
    const onMove = () => measure()
    window.addEventListener('resize', onMove)
    window.addEventListener('scroll', onMove, true)
    return () => {
      window.removeEventListener('resize', onMove)
      window.removeEventListener('scroll', onMove, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, menuMinWidth])

  useEffect(() => {
    if (!open) return
    setActive(selectedIndex)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  useEffect(() => {
    if (!open || active < 0) return
    menuRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const move = (dir: 1 | -1) => {
    if (options.length === 0) return
    setActive((current) => {
      let next = current
      for (let step = 0; step < options.length; step++) {
        next = (next + dir + options.length) % options.length
        if (!options[next].disabled) break
      }
      return next
    })
  }

  const choose = (option: DropdownOption) => {
    if (option.disabled) return
    onChange(option.value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        break
      case 'ArrowDown':
        e.preventDefault()
        move(1)
        break
      case 'ArrowUp':
        e.preventDefault()
        move(-1)
        break
      case 'Home':
        e.preventDefault()
        setActive(0)
        break
      case 'End':
        e.preventDefault()
        setActive(options.length - 1)
        break
      case 'Enter':
      case ' ': {
        e.preventDefault()
        const option = options[active]
        if (option) choose(option)
        break
      }
      case 'Tab':
        setOpen(false)
        break
      default:
        break
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={triggerClassName}
      >
        {trigger ? (
          trigger({ open })
        ) : (
          <>
            <span className={`truncate ${selected ? 'text-text-primary' : 'text-text-secondary'}`}>
              {selected?.label ?? placeholder}
            </span>
            <ChevronDown
              size={16}
              className={`shrink-0 text-text-secondary transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            aria-label={ariaLabel}
            style={{
              position: 'fixed',
              left: pos.left,
              top: pos.top,
              bottom: pos.bottom,
              width: pos.width,
              maxHeight: pos.maxHeight,
            }}
            className="z-[100] overflow-y-auto scrollbar-thin rounded-xl border border-border bg-white p-1.5 shadow-lg animate-fade-in"
          >
            {options.length === 0 ? (
              <p className="px-2.5 py-2 text-sm text-text-secondary">No options</p>
            ) : (
              options.map((option, index) => {
                const isSelected = option.value === value
                const isActive = index === active
                return (
                  <button
                    key={`${option.value}-${index}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled || undefined}
                    data-index={index}
                    tabIndex={-1}
                    disabled={option.disabled}
                    onMouseEnter={() => !option.disabled && setActive(index)}
                    onClick={() => choose(option)}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                      option.disabled
                        ? 'cursor-not-allowed text-text-secondary/50'
                        : isSelected
                          ? 'bg-primary-light font-medium text-primary'
                          : isActive
                            ? 'bg-bg-secondary text-text-primary'
                            : 'text-text-primary'
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && <Check size={14} className="shrink-0" />}
                  </button>
                )
              })
            )}
          </div>,
          document.body,
        )}
    </>
  )
}
