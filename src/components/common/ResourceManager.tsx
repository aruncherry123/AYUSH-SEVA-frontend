import { useMemo, useState, type ReactNode } from 'react'
import { Search, Plus, Eye, Pencil, Trash2, X, type LucideIcon } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { Modal } from '../ui/modal'
import { Drawer } from '../ui/drawer'
import { ConfirmDialog } from '../ui/confirm-dialog'
import { DataTable, type Column } from '../ui/data-table'
import { Card } from '../ui/card'
import { PageHeader } from './PageHeader'
import { StatusBadge } from '../../utils/status'
import { useToast } from '../../state/ToastContext'

export interface FieldDef<T> {
  name: keyof T & string
  label: string
  type?: 'text' | 'number' | 'email' | 'tel' | 'date' | 'select' | 'textarea'
  options?: string[]
  required?: boolean
  placeholder?: string
  full?: boolean
  defaultValue?: string
  status?: boolean
}

export interface FilterDef<T> {
  name: keyof T & string
  label: string
  options: string[]
}

export type ResourceLayout = 'standard' | 'console' | 'workspace'

interface ResourceManagerProps<T extends { id: string }> {
  title: string
  description: string
  addLabel: string
  itemNoun: string
  items: T[]
  columns: Column<T>[]
  fields: FieldDef<T>[]
  searchKeys: (keyof T & string)[]
  filters?: FilterDef<T>[]
  pageSize?: number
  onCreate: (values: Record<string, string>) => void
  onUpdate: (id: string, values: Record<string, string>) => void
  onDelete: (id: string) => void
  renderDetail?: (row: T) => ReactNode
  renderFormExtra?: (values: Record<string, string>, setValue: (name: string, value: string) => void) => ReactNode
  /** Extra inline actions rendered before the default view/edit/delete controls. */
  rowActions?: (row: T) => ReactNode
  toolbarExtra?: ReactNode
  emptyTitle?: string
  /** Render only the working surface so the page can live inside a tabbed hub. */
  embedded?: boolean
  /**
   * Layout family — keeps the same behaviour but gives each domain its own
   * page identity: a clinical ledger, an inventory console, or a workforce board.
   */
  layout?: ResourceLayout
  icon?: LucideIcon
  eyebrow?: string
  /** Action-level permissions; the caller resolves these from the signed-in role. */
  canCreate?: boolean
  canEdit?: boolean
  canDelete?: boolean
}

export function ResourceManager<T extends { id: string }>({
  title,
  description,
  addLabel,
  itemNoun,
  items,
  columns,
  fields,
  searchKeys,
  filters = [],
  pageSize = 8,
  onCreate,
  onUpdate,
  onDelete,
  renderDetail,
  renderFormExtra,
  rowActions,
  toolbarExtra,
  emptyTitle,
  embedded = false,
  layout = 'standard',
  icon,
  eyebrow,
  canCreate = true,
  canEdit = true,
  canDelete = true,
}: ResourceManagerProps<T>) {
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [detail, setDetail] = useState<T | null>(null)
  const [pendingDelete, setPendingDelete] = useState<T | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      const matchesSearch =
        !q ||
        searchKeys.some((key) => String((item as Record<string, unknown>)[key] ?? '').toLowerCase().includes(q))
      const matchesFilters = Object.entries(activeFilters).every(
        ([key, val]) => !val || String((item as Record<string, unknown>)[key]) === val,
      )
      return matchesSearch && matchesFilters
    })
  }, [items, query, activeFilters, searchKeys])

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length
  const hasFilters = Boolean(query.trim()) || activeFilterCount > 0

  const setValue = (name: string, value: string) => setValues((prev) => ({ ...prev, [name]: value }))

  const clearFilters = () => {
    setQuery('')
    setActiveFilters({})
  }

  const openCreate = () => {
    const initial: Record<string, string> = {}
    fields.forEach((f) => {
      initial[f.name] = f.defaultValue ?? (f.type === 'select' && f.options ? f.options[0] : '')
    })
    setValues(initial)
    setErrors({})
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (row: T) => {
    if (!canEdit) return
    const initial: Record<string, string> = {}
    fields.forEach((f) => {
      initial[f.name] = String((row as Record<string, unknown>)[f.name] ?? '')
    })
    setValues(initial)
    setErrors({})
    setEditing(row)
    setFormOpen(true)
  }

  const validate = () => {
    const next: Record<string, string> = {}
    fields.forEach((f) => {
      if (f.required && !values[f.name]?.trim()) next[f.name] = `${f.label} is required`
      if (f.type === 'email' && values[f.name] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values[f.name]))
        next[f.name] = 'Enter a valid email address'
    })
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    window.setTimeout(() => {
      if (editing) {
        onUpdate(editing.id, values)
        toast.success(`${itemNoun} updated`, 'Changes have been saved successfully.')
      } else {
        onCreate(values)
        toast.success(`${itemNoun} created`, `A new ${itemNoun.toLowerCase()} has been added.`)
      }
      setSaving(false)
      setFormOpen(false)
    }, 250)
  }

  const confirmDelete = () => {
    if (!pendingDelete) return
    onDelete(pendingDelete.id)
    toast.success(`${itemNoun} deleted`, 'The record has been removed.')
    setPendingDelete(null)
  }

  const renderFieldInput = (field: FieldDef<T>) => {
    const common = {
      label: field.label,
      required: field.required,
      error: errors[field.name],
      placeholder: field.placeholder,
      value: values[field.name] ?? '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setValue(field.name, e.target.value),
    }
    if (field.type === 'select') {
      return (
        <Select {...common}>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </Select>
      )
    }
    if (field.type === 'textarea') return <Textarea {...common} />
    return <Input {...common} type={field.type ?? 'text'} />
  }

  const actions = (row: T) => (
    <>
      {rowActions?.(row)}
      {renderDetail && (
        <button
          onClick={() => setDetail(row)}
          className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-bg-secondary hover:text-primary"
          aria-label={`View ${itemNoun}`}
        >
          <Eye size={14} />
        </button>
      )}
      {canEdit && (
        <button
          onClick={() => openEdit(row)}
          className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-bg-secondary hover:text-primary"
          aria-label={`Edit ${itemNoun}`}
        >
          <Pencil size={14} />
        </button>
      )}
      {canDelete && (
        <button
          onClick={() => setPendingDelete(row)}
          className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-[#fef3f2] hover:text-error"
          aria-label={`Delete ${itemNoun}`}
        >
          <Trash2 size={14} />
        </button>
      )}
    </>
  )

  const filterSelect = (f: FilterDef<T>) => (
    <div key={f.name} className="w-[148px]">
      <Select
        value={activeFilters[f.name] ?? ''}
        onChange={(e) => setActiveFilters((prev) => ({ ...prev, [f.name]: e.target.value }))}
        aria-label={`Filter by ${f.label}`}
      >
        <option value="">All {f.label.toLowerCase()}</option>
        {f.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </Select>
    </div>
  )

  const toolbar = (extraFilters = filters) => (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
      <div className="w-full xl:max-w-[280px]">
        <Input
          icon={<Search size={15} />}
          placeholder={`Search ${title.toLowerCase()}…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={`Search ${title}`}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 xl:ml-auto">
        {extraFilters.map(filterSelect)}
        {toolbarExtra}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-text-secondary">
            <X size={13} /> Clear
          </Button>
        )}
        <p className="ml-auto hidden text-[11.5px] text-text-tertiary sm:block">
          <span className="font-medium tabular-nums text-text-secondary">{filtered.length}</span> of{' '}
          <span className="tabular-nums">{items.length}</span>
        </p>
      </div>
    </div>
  )

  const dialogs = (
    <>
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit ${itemNoun}` : addLabel}
        description={editing ? 'Update the details below.' : `Fill in the details to add a new ${itemNoun.toLowerCase()}.`}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} loading={saving}>
              {editing ? 'Save changes' : `Create ${itemNoun.toLowerCase()}`}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.name} className={field.full ? 'sm:col-span-2' : ''}>
              {renderFieldInput(field)}
            </div>
          ))}
          {renderFormExtra?.(values, setValue)}
          <button type="submit" className="hidden" aria-hidden="true" />
        </form>
      </Modal>

      {renderDetail && (
        <Drawer
          open={!!detail}
          onClose={() => setDetail(null)}
          title={title.replace(/s$/, '') + ' details'}
          width="md"
          footer={
            detail && (canEdit || canDelete) && (
              <>
                {canEdit && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      openEdit(detail)
                      setDetail(null)
                    }}
                  >
                    <Pencil size={14} /> Edit
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="danger"
                    onClick={() => {
                      setPendingDelete(detail)
                      setDetail(null)
                    }}
                  >
                    <Trash2 size={14} /> Delete
                  </Button>
                )}
              </>
            )
          }
        >
          {detail && renderDetail(detail)}
        </Drawer>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title={`Delete ${itemNoun}?`}
        message="This action cannot be undone. The record will be permanently removed from the demo dataset."
      />
    </>
  )

  const table = (
    <DataTable
      columns={columns}
      rows={filtered}
      rowKey={(row) => row.id}
      pageSize={pageSize}
      actions={actions}
      onRowClick={renderDetail ? (row) => setDetail(row) : undefined}
      density={layout === 'console' ? 'compact' : 'comfortable'}
      emptyTitle={emptyTitle ?? `No ${title.toLowerCase()} found`}
      emptyDescription="Adjust your search or filters, or add a new record."
    />
  )

  /* Workforce board: a clickable status rail beside the table. */
  if (layout === 'workspace' && filters.length > 0) {
    const primary = filters[0]
    const otherFilters = filters.slice(1)
    const base = items.filter((item) => {
      const q = query.trim().toLowerCase()
      const matchesSearch =
        !q || searchKeys.some((key) => String((item as Record<string, unknown>)[key] ?? '').toLowerCase().includes(q))
      const matchesOthers = otherFilters.every(
        (f) => !activeFilters[f.name] || String((item as Record<string, unknown>)[f.name]) === activeFilters[f.name],
      )
      return matchesSearch && matchesOthers
    })
    const counts = primary.options.map((option) => ({
      option,
      count: base.filter((item) => String((item as Record<string, unknown>)[primary.name]) === option).length,
    }))
    const primaryValue = activeFilters[primary.name] ?? ''

    return (
      <div className="space-y-6">
        {!embedded && (
          <PageHeader
            variant="compact"
            eyebrow={eyebrow ?? 'Workforce'}
            title={title}
            description={description}
            actions={
              canCreate ? (
                <Button onClick={openCreate}>
                  <Plus size={15} /> {addLabel}
                </Button>
              ) : undefined
            }
          />
        )}

        <div>
          {toolbar(otherFilters)}

          <div className="grid grid-cols-1 gap-6 pt-5 lg:grid-cols-[196px_minmax(0,1fr)]">
            <aside className="self-start">
              <p className="label-micro mb-2.5">{primary.label}</p>
              <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 no-scrollbar lg:mx-0 lg:flex-col lg:px-0">
                <button
                  onClick={() => setActiveFilters((prev) => ({ ...prev, [primary.name]: '' }))}
                  className={`flex shrink-0 items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-[12.5px] transition-colors lg:w-full ${
                    !primaryValue
                      ? 'bg-bg-secondary font-medium text-text-primary'
                      : 'text-text-secondary hover:bg-bg-secondary/70 hover:text-text-primary'
                  }`}
                >
                  <span>All</span>
                  <span className="text-[11px] tabular-nums text-text-tertiary">{base.length}</span>
                </button>
                {counts.map(({ option, count }) => {
                  const isActive = primaryValue === option
                  return (
                    <button
                      key={option}
                      onClick={() => setActiveFilters((prev) => ({ ...prev, [primary.name]: isActive ? '' : option }))}
                      className={`flex shrink-0 items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-[12.5px] transition-colors lg:w-full ${
                        isActive
                          ? 'bg-bg-secondary font-medium text-text-primary'
                          : 'text-text-secondary hover:bg-bg-secondary/70 hover:text-text-primary'
                      }`}
                    >
                      <span className="truncate">{option}</span>
                      <span className="text-[11px] tabular-nums text-text-tertiary">{count}</span>
                    </button>
                  )
                })}
              </div>
            </aside>

            <Card className="overflow-hidden">{table}</Card>
          </div>
        </div>

        {dialogs}
      </div>
    )
  }

  /* Inventory console: a tinted ledger toolbar with compact rows. */
  if (layout === 'console') {
    return (
      <div className="space-y-6">
        {!embedded && (
          <PageHeader
            variant="compact"
            eyebrow={eyebrow ?? 'Inventory'}
            title={title}
            description={description}
            actions={
              canCreate ? (
                <Button onClick={openCreate}>
                  <Plus size={15} /> {addLabel}
                </Button>
              ) : undefined
            }
          />
        )}

        <div className="overflow-hidden rounded-xl border border-border">
          <div className="border-b border-border bg-surface-muted px-4 py-3">{toolbar()}</div>
          {table}
        </div>

        {dialogs}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!embedded && (
        <PageHeader
          variant="compact"
          icon={icon}
          eyebrow={eyebrow ?? 'Clinical care'}
          title={title}
          description={description}
          actions={
            canCreate ? (
              <Button onClick={openCreate}>
                <Plus size={15} /> {addLabel}
              </Button>
            ) : undefined
          }
        />
      )}

      <div>
        {toolbar(filters)}
        <Card className="mt-4 overflow-hidden">{table}</Card>
      </div>

      {dialogs}
    </div>
  )
}

export function DetailList({ items }: { items: { label: string; value: ReactNode; status?: boolean }[] }) {
  return (
    <dl className="divide-y divide-border">
      {items.map((item) => (
        <div key={item.label} className="flex items-start justify-between gap-4 py-2.5">
          <dt className="text-[12px] text-text-secondary">{item.label}</dt>
          <dd className="text-right text-[12.5px] font-medium text-text-primary">
            {item.status && typeof item.value === 'string' ? <StatusBadge status={item.value} /> : item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
