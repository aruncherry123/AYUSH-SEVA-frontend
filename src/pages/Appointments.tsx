import { useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, X, ChevronRight, Stethoscope } from 'lucide-react'
import { PageHeader } from '../components/common/PageHeader'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { Modal } from '../components/ui/modal'
import { Drawer } from '../components/ui/drawer'
import { ConfirmDialog } from '../components/ui/confirm-dialog'
import { EmptyState } from '../components/ui/states'
import { Avatar } from '../components/ui/avatar'
import { StatusBadge } from '../utils/status'
import { formatDate } from '../utils/format'
import { useToast } from '../state/ToastContext'
import { useAuth } from '../state/AuthContext'
import { useResource } from '../hooks/useResource'
import type { Appointment } from '../types'

const departments = ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Surgery', 'Dermatology', 'Emergency', 'Gynecology']
const types: Appointment['type'][] = ['OPD', 'Follow-up', 'Emergency', 'Teleconsultation']
const statuses: Appointment['status'][] = ['Scheduled', 'Confirmed', 'Waiting', 'In Consultation', 'Completed', 'Cancelled', 'No Show']

const today = '2026-10-09'

function minutesOf(time: string) {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
  if (!match) return 0
  const [, h, m, meridiem] = match
  let hour = Number(h)
  if (meridiem?.toUpperCase() === 'PM' && hour !== 12) hour += 12
  if (meridiem?.toUpperCase() === 'AM' && hour === 12) hour = 0
  return hour * 60 + Number(m)
}

function dateParts(date: string) {
  const d = new Date(`${date}T00:00:00`)
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
    day: d.toLocaleDateString('en-US', { day: '2-digit' }),
    month: d.toLocaleDateString('en-US', { month: 'short' }),
  }
}

function periodOf(time: string) {
  const mins = minutesOf(time)
  if (mins < 12 * 60) return 'Morning'
  if (mins < 17 * 60) return 'Afternoon'
  return 'Evening'
}

const emptyForm = (date: string): Record<string, string> => ({
  patientName: '',
  doctorName: '',
  department: departments[0],
  type: 'OPD',
  date,
  time: '',
  status: 'Scheduled',
  reason: '',
})

export default function Appointments() {
  const { items, create, update, remove } = useResource('appointments')
  const { can } = useAuth()
  const toast = useToast()
  const canCreate = can('appointments.create')
  const canEdit = can('appointments.edit')
  const canCancel = can('appointments.cancel')

  const [selectedDate, setSelectedDate] = useState(today)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [department, setDepartment] = useState('')
  const [type, setType] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Appointment | null>(null)
  const [values, setValues] = useState<Record<string, string>>(emptyForm(today))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [detail, setDetail] = useState<Appointment | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Appointment | null>(null)

  const dates = useMemo(() => {
    const unique = Array.from(new Set(items.map((a) => a.date))).sort()
    if (!unique.includes(today)) unique.unshift(today)
    return unique
  }, [items])

  const activeDate = dates.includes(selectedDate) ? selectedDate : dates[0]

  const dayCounts = useMemo(() => {
    const map = new Map<string, number>()
    items.forEach((a) => map.set(a.date, (map.get(a.date) ?? 0) + 1))
    return map
  }, [items])

  const hasFilters = Boolean(query.trim() || status || department || type)

  const clearFilters = () => {
    setQuery('')
    setStatus('')
    setDepartment('')
    setType('')
  }

  const dayAppointments = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items
      .filter((a) => a.date === activeDate)
      .filter(
        (a) =>
          (!q ||
            a.patientName.toLowerCase().includes(q) ||
            a.doctorName.toLowerCase().includes(q) ||
            a.reason.toLowerCase().includes(q)) &&
          (!status || a.status === status) &&
          (!department || a.department === department) &&
          (!type || a.type === type),
      )
      .sort((a, b) => minutesOf(a.time) - minutesOf(b.time))
  }, [items, activeDate, query, status, department, type])

  const grouped = useMemo(() => {
    const order = ['Morning', 'Afternoon', 'Evening']
    return order
      .map((period) => ({ period, rows: dayAppointments.filter((a) => periodOf(a.time) === period) }))
      .filter((group) => group.rows.length > 0)
  }, [dayAppointments])

  const daySummary = useMemo(() => {
    const all = items.filter((a) => a.date === activeDate)
    return {
      total: all.length,
      active: all.filter((a) => a.status !== 'Completed' && a.status !== 'Cancelled' && a.status !== 'No Show').length,
      completed: all.filter((a) => a.status === 'Completed').length,
    }
  }, [items, activeDate])

  const openCreate = () => {
    if (!canCreate) return
    setEditing(null)
    setValues(emptyForm(activeDate))
    setErrors({})
    setFormOpen(true)
  }

  const openEdit = (row: Appointment) => {
    if (!canEdit) return
    setEditing(row)
    setValues({
      patientName: row.patientName,
      doctorName: row.doctorName,
      department: row.department,
      type: row.type,
      date: row.date,
      time: row.time,
      status: row.status,
      reason: row.reason,
    })
    setErrors({})
    setFormOpen(true)
    setDetail(null)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!values.patientName.trim()) next.patientName = 'Patient name is required'
    if (!values.doctorName.trim()) next.doctorName = 'Doctor name is required'
    if (!values.date) next.date = 'Date is required'
    if (!values.time.trim()) next.time = 'Time is required'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSaving(true)
    window.setTimeout(() => {
      const payload = {
        patientName: values.patientName.trim(),
        doctorName: values.doctorName.trim(),
        department: values.department,
        type: values.type as Appointment['type'],
        date: values.date,
        time: values.time.trim(),
        status: values.status as Appointment['status'],
        reason: values.reason.trim(),
      }
      if (editing) {
        update(editing.id, payload)
        toast.success('Appointment updated')
      } else {
        create(payload)
        setSelectedDate(values.date)
        toast.success('Appointment scheduled')
      }
      setSaving(false)
      setFormOpen(false)
    }, 200)
  }

  const field =
    (name: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [name]: e.target.value }))
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }

  return (
    <div className="space-y-6">
      <PageHeader
        variant="compact"
        eyebrow="Outpatient scheduling"
        title="Appointments"
        description="A day-by-day view of every scheduled, waiting and completed visit."
        actions={
          canCreate ? (
            <Button onClick={openCreate}>
              <Plus size={15} /> New appointment
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[212px_minmax(0,1fr)] xl:grid-cols-[232px_minmax(0,1fr)]">
        {/* Date rail */}
        <aside className="self-start lg:sticky lg:top-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="label-micro">Schedule</h2>
            <span className="text-[11px] text-text-tertiary">October 2026</span>
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar lg:mx-0 lg:flex-col lg:px-0">
            {dates.map((date) => {
              const parts = dateParts(date)
              const isActive = date === activeDate
              const count = dayCounts.get(date) ?? 0
              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`relative flex min-w-[132px] items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors lg:min-w-0 lg:w-full ${
                    isActive
                      ? 'border-primary-border bg-primary-light'
                      : 'border-transparent hover:border-border hover:bg-bg-secondary'
                  }`}
                >
                  <div className="flex w-9 flex-col items-center rounded-md bg-white py-1">
                    <span className="text-[9.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
                      {parts.weekday}
                    </span>
                    <span
                      className={`font-display text-[17px] font-semibold leading-5 tabular-nums ${
                        isActive ? 'text-primary' : 'text-text-primary'
                      }`}
                    >
                      {parts.day}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[12.5px] font-medium ${isActive ? 'text-primary' : 'text-text-primary'}`}>
                      {parts.month}
                    </p>
                    <p className="text-[11px] text-text-tertiary">
                      {count} appointment{count === 1 ? '' : 's'}
                    </p>
                  </div>
                  {date === today && (
                    <span className="shrink-0 rounded bg-white px-1 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.05em] text-text-secondary">
                      Today
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="mt-5 hidden rounded-lg border border-border p-3.5 lg:block">
            <p className="label-micro">Day summary</p>
            <dl className="mt-2.5 space-y-2 text-[12px]">
              <div className="flex items-center justify-between">
                <dt className="text-text-secondary">Booked</dt>
                <dd className="font-medium tabular-nums text-text-primary">{daySummary.total}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-text-secondary">Still active</dt>
                <dd className="font-medium tabular-nums text-text-primary">{daySummary.active}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-text-secondary">Completed</dt>
                <dd className="font-medium tabular-nums text-text-primary">{daySummary.completed}</dd>
              </div>
            </dl>
          </div>
        </aside>

        {/* Day timeline */}
        <section className="min-w-0">
          <div className="flex flex-col gap-3 border-b border-border pb-4 xl:flex-row xl:items-center">
            <div className="w-full xl:max-w-[260px]">
              <Input
                icon={<Search size={15} />}
                placeholder="Search patient, doctor or reason…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search appointments"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 xl:ml-auto">
              <div className="w-[140px]">
                <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
                  <option value="">All statuses</option>
                  {statuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </div>
              <div className="w-[140px]">
                <Select value={department} onChange={(e) => setDepartment(e.target.value)} aria-label="Filter by department">
                  <option value="">All departments</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </Select>
              </div>
              <div className="w-[132px]">
                <Select value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter by type">
                  <option value="">All types</option>
                  {types.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </div>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-text-secondary">
                  <X size={13} /> Clear
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-[13px] font-medium text-text-primary">{formatDate(activeDate)}</p>
              <p className="text-[11.5px] text-text-tertiary">
                {dayAppointments.length} of {daySummary.total} appointments shown
              </p>
            </div>
          </div>

          {grouped.length === 0 ? (
            <div className="rounded-xl border border-border">
              <EmptyState
                title="No appointments for this day"
                description={
                  hasFilters
                    ? 'No visits match the current filters. Try clearing them.'
                    : 'Nothing has been booked yet. Create the first appointment for this day.'
                }
                action={
                  hasFilters ? (
                    <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
                  ) : canCreate ? (
                    <Button onClick={openCreate}><Plus size={14} /> New appointment</Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="space-y-7">
              {grouped.map((group) => (
                <div key={group.period}>
                  <div className="mb-2 flex items-center gap-3">
                    <p className="label-micro">{group.period}</p>
                    <span className="h-px flex-1 bg-border" />
                    <p className="text-[11px] text-text-tertiary">{group.rows.length}</p>
                  </div>
                  <ul>
                    {group.rows.map((a) => (
                      <li key={a.id} className="group flex items-center gap-1 border-b border-border/80 transition-colors last:border-0 hover:bg-surface-muted">
                        <button
                          onClick={() => setDetail(a)}
                          className="flex min-w-0 flex-1 items-center gap-3 py-3.5 text-left"
                        >
                          <div className="w-[62px] shrink-0 pl-1">
                            <p className="text-[12px] font-medium tabular-nums text-text-primary">{a.time}</p>
                            <p className="text-[10.5px] text-text-tertiary">{a.type}</p>
                          </div>
                          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                            <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border" aria-hidden="true" />
                            <span className="relative h-2 w-2 rounded-full border-2 border-white bg-primary ring-1 ring-primary/30" />
                          </span>
                          <Avatar name={a.patientName} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-text-primary">{a.patientName}</p>
                            <p className="truncate text-[11.5px] text-text-secondary">
                              {a.doctorName} · {a.department}
                            </p>
                          </div>
                          <div className="hidden min-w-0 max-w-[220px] flex-1 lg:block">
                            <p className="truncate text-[11.5px] text-text-secondary">{a.reason || 'No reason recorded'}</p>
                          </div>
                          <div className="shrink-0">
                            <StatusBadge status={a.status} />
                          </div>
                        </button>
                        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                          {canEdit && (
                            <button
                              onClick={() => openEdit(a)}
                              className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-white hover:text-primary"
                              aria-label={`Edit appointment for ${a.patientName}`}
                            >
                              <Pencil size={13} />
                            </button>
                          )}
                          {canCancel && (
                            <button
                              onClick={() => setPendingDelete(a)}
                              className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-white hover:text-error"
                              aria-label={`Delete appointment for ${a.patientName}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                        <ChevronRight size={14} className="mr-1 shrink-0 text-text-tertiary group-hover:hidden" />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Create / edit */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit appointment' : 'New appointment'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={saving}>{editing ? 'Save changes' : 'Schedule appointment'}</Button>
          </>
        }
      >
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Patient name"
            required
            placeholder="e.g. John Carter"
            value={values.patientName}
            onChange={field('patientName')}
            error={errors.patientName}
          />
          <Input
            label="Doctor"
            required
            placeholder="e.g. Dr. Sarah Johnson"
            value={values.doctorName}
            onChange={field('doctorName')}
            error={errors.doctorName}
          />
          <Select label="Department" value={values.department} onChange={field('department')}>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
          <Select label="Type" value={values.type} onChange={field('type')}>
            {types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
          <Input label="Date" type="date" required value={values.date} onChange={field('date')} error={errors.date} />
          <Input label="Time" placeholder="09:30 AM" required value={values.time} onChange={field('time')} error={errors.time} />
          <Select label="Status" value={values.status} onChange={field('status')}>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <div className="sm:col-span-2">
            <Textarea
              label="Reason for visit"
              placeholder="Brief description of the complaint"
              value={values.reason}
              onChange={field('reason')}
            />
          </div>
          <button type="submit" className="hidden" aria-hidden="true" />
        </form>
      </Modal>

      {/* Detail */}
      <Drawer
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Appointment details"
        width="md"
        footer={
          detail && (canEdit || canCancel) && (
            <>
              {canEdit && (
                <Button variant="outline" onClick={() => openEdit(detail)}>
                  <Pencil size={14} /> Edit
                </Button>
              )}
              {canCancel && (
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
        {detail && (
          <div className="space-y-6">
            <div className="flex items-start gap-3.5">
              <Avatar name={detail.patientName} size="lg" />
              <div className="min-w-0">
                <p className="font-display text-[19px] font-semibold leading-6 tracking-[-0.02em] text-text-primary">
                  {detail.patientName}
                </p>
                <p className="mt-1 text-[12.5px] text-text-secondary">
                  {detail.type} · {detail.department}
                </p>
                <div className="mt-2">
                  <StatusBadge status={detail.status} />
                </div>
              </div>
            </div>

            <dl className="divide-y divide-border border-y border-border">
              {[
                ['Doctor', detail.doctorName],
                ['Date', formatDate(detail.date)],
                ['Time', detail.time],
                ['Reason', detail.reason || '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4 py-2.5">
                  <dt className="text-[12px] text-text-secondary">{label}</dt>
                  <dd className="text-right text-[12.5px] font-medium text-text-primary">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="flex items-start gap-2.5 rounded-lg bg-bg-secondary p-3">
              <Stethoscope size={15} className="mt-0.5 shrink-0 text-text-tertiary" />
              <p className="text-[11.5px] leading-5 text-text-secondary">
                Appointments can be rescheduled or cancelled from this panel. Patient clinical history stays available on
                their registry record.
              </p>
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            remove(pendingDelete.id)
            toast.success('Appointment deleted')
          }
          setPendingDelete(null)
        }}
        title="Delete appointment?"
        message={
          pendingDelete
            ? `This will remove the ${pendingDelete.time} appointment for ${pendingDelete.patientName}. This action cannot be undone.`
            : ''
        }
      />

    </div>
  )
}
