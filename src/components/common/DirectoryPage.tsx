import { useMemo, useState, type ReactNode } from 'react'
import { Search, Plus, LayoutGrid, List, Pencil, Trash2, Eye, X } from 'lucide-react'
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
import { EmptyState } from '../ui/states'
import { useToast } from '../../state/ToastContext'
import type { FieldDef, FilterDef } from './ResourceManager'

interface DirectoryPageProps<T extends { id: string }> {
  title: string
  description: string
  addLabel: string
  itemNoun: string
  items: T[]
  columns: Column<T>[]
  fields: FieldDef<T>[]
  searchKeys: (keyof T & string)[]
  filters?: FilterDef<T>[]
  sortOptions?: { key: keyof T & string; label: string }[]
  renderCard: (row: T) => ReactNode
  renderDetail: (row: T) => ReactNode
  onCreate: (values: Record<string, string>) => void
  onUpdate: (id: string, values: Record<string, string>) => void
  onDelete: (id: string) => void
  /** Render only the directory surface so the page can live inside a tabbed hub. */
  embedded?: boolean
  canCreate?: boolean
  canEdit?: boolean
  canDelete?: boolean
}

/**
 * Directory archetype: a compact toolbar over a switchable card/table surface.
 * Used by people, facility and supplier directories where browsing matters
 * more than dense row operations.
 */
export function DirectoryPage<T extends { id: string }>({
  title,
  description,
  addLabel,
  itemNoun,
  items,
  columns,
  fields,
  searchKeys,
  filters = [],
  sortOptions = [],
  renderCard,
  renderDetail,
  onCreate,
  onUpdate,
  onDelete,
  embedded = false,
  canCreate = true,
  canEdit = true,
  canDelete = true,
}: DirectoryPageProps<T>) {
  const toast = useToast()
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [query, setQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [sortKey, setSortKey] = useState<string>(sortOptions[0]?.key ?? '')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [detail, setDetail] = useState<T | null>(null)
  const [pendingDelete, setPendingDelete] = useState<T | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = items.filter((item) => {
      const matchesSearch =
        !q || searchKeys.some((k) => String((item as Record<string, unknown>)[k] ?? '').toLowerCase().includes(q))
      const matchesFilters = Object.entries(activeFilters).every(
        ([k, v]) => !v || String((item as Record<string, unknown>)[k]) === v,
      )
      return matchesSearch && matchesFilters
    })
    if (sortKey) {
      return [...list].sort((a, b) => {
        const av = String((a as Record<string, unknown>)[sortKey] ?? '')
        const bv = String((b as Record<string, unknown>)[sortKey] ?? '')
        const an = Number(av)
        const bn = Number(bv)
        if (av.trim() !== '' && bv.trim() !== '' && !Number.isNaN(an) && !Number.isNaN(bn)) return an - bn
        return av.localeCompare(bv)
      })
    }
    return list
  }, [items, query, activeFilters, searchKeys, sortKey])

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length
  const hasFilters = Boolean(query.trim()) || activeFilterCount > 0

  const clearFilters = () => {
    setQuery('')
    setActiveFilters({})
  }

  const openCreate = () => {
    const initial: Record<string, string> = {}
    fields.forEach((f) => (initial[f.name] = f.defaultValue ?? (f.type === 'select' && f.options ? f.options[0] : '')))
    setValues(initial)
    setErrors({})
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (row: T) => {
    if (!canEdit) return
    const initial: Record<string, string> = {}
    fields.forEach((f) => (initial[f.name] = String((row as Record<string, unknown>)[f.name] ?? '')))
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
        toast.success(`${itemNoun} updated`)
      } else {
        onCreate(values)
        toast.success(`${itemNoun} created`)
      }
      setSaving(false)
      setFormOpen(false)
    }, 200)
  }

  const renderInput = (field: FieldDef<T>) => {
    const common = {
      label: field.label,
      required: field.required,
      error: errors[field.name],
      placeholder: field.placeholder,
      value: values[field.name] ?? '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setValues((prev) => ({ ...prev, [field.name]: e.target.value })),
    }
    if (field.type === 'select')
      return (
        <Select {...common}>
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
      )
    if (field.type === 'textarea') return <Textarea {...common} />
    return <Input {...common} type={field.type ?? 'text'} />
  }

  return (
    <div className="space-y-6">
      {!embedded && (
        <PageHeader
          variant="compact"
          eyebrow="Directory"
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
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border pb-4 xl:flex-row xl:items-center">
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
            {sortOptions.length > 0 && (
              <div className="w-[150px]">
                <Select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                  aria-label="Sort by"
                >
                  {sortOptions.map((s) => (
                    <option key={s.key} value={s.key}>
                      Sort · {s.label}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {filters.map((f) => (
              <div key={f.name} className="w-[150px]">
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
            ))}

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-text-secondary">
                <X size={13} /> Clear
              </Button>
            )}

            <div className="ml-auto flex items-center gap-0.5 rounded-lg border border-border p-0.5">
              <button
                onClick={() => setView('grid')}
                className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                  view === 'grid' ? 'bg-bg-secondary text-text-primary' : 'text-text-tertiary hover:text-text-secondary'
                }`}
                aria-label="Card view"
                aria-pressed={view === 'grid'}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setView('table')}
                className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                  view === 'table' ? 'bg-bg-secondary text-text-primary' : 'text-text-tertiary hover:text-text-secondary'
                }`}
                aria-label="Table view"
                aria-pressed={view === 'table'}
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between py-3">
          <p className="text-[11.5px] text-text-tertiary">
            <span className="font-medium text-text-secondary tabular-nums">{filtered.length}</span> of{' '}
            <span className="tabular-nums">{items.length}</span> {title.toLowerCase()}
          </p>
          {hasFilters && (
            <p className="text-[11.5px] text-text-tertiary">
              {activeFilterCount > 0 ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} applied` : 'Filtered by search'}
            </p>
          )}
        </div>

        {/* Results */}
        <div className="min-w-0">
          {filtered.length === 0 ? (
            <Card>
              <EmptyState
                title={`No ${title.toLowerCase()} found`}
                description="Try a different search term or clear your filters."
                action={
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            </Card>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {filtered.map((row) => (
                <div
                  key={row.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setDetail(row)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setDetail(row)
                    }
                  }}
                  aria-label={`View ${itemNoun}`}
                  className="group cursor-pointer rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20"
                >
                  {renderCard(row)}
                </div>
              ))}
            </div>
          ) : (
            <Card className="overflow-hidden">
              <DataTable
                columns={columns}
                rows={filtered}
                rowKey={(row) => row.id}
                pageSize={8}
                onRowClick={(row) => setDetail(row)}
                actions={(row) => (
                  <>
                    <button
                      onClick={() => setDetail(row)}
                      className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-bg-secondary hover:text-primary"
                      aria-label="View"
                    >
                      <Eye size={14} />
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => openEdit(row)}
                        className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-bg-secondary hover:text-primary"
                        aria-label="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => setPendingDelete(row)}
                        className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-[#fef3f2] hover:text-error"
                        aria-label="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </>
                )}
              />
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit ${itemNoun}` : addLabel}
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
          {fields.map((f) => (
            <div key={f.name} className={f.full ? 'sm:col-span-2' : ''}>
              {renderInput(f)}
            </div>
          ))}
          <button type="submit" className="hidden" aria-hidden="true" />
        </form>
      </Modal>

      <Drawer
        open={!!detail}
        onClose={() => setDetail(null)}
        title={itemNoun + ' details'}
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

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            onDelete(pendingDelete.id)
            toast.success(`${itemNoun} deleted`)
          }
          setPendingDelete(null)
        }}
        title={`Delete ${itemNoun}?`}
        message="This action cannot be undone. The record will be removed from the demo dataset."
      />
    </div>
  )
}
