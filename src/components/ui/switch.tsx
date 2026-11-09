interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  id?: string
}

export const Switch = ({ checked, onChange, label, description, id }: SwitchProps) => (
  <div className="flex items-center justify-between gap-4">
    {(label || description) && (
      <div>
        {label && <p className="text-sm font-medium text-text-primary">{label}</p>}
        {description && <p className="text-xs text-text-secondary mt-0.5">{description}</p>}
      </div>
    )}
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5.5 w-10 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-border-strong'
      }`}
      style={{ height: 22, width: 40 }}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[20px]' : 'translate-x-[2px]'
        }`}
      />
    </button>
  </div>
)
