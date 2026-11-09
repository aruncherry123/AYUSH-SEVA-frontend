import { useState } from 'react'
import {
  Siren,
  Plus,
  ArrowRight,
  GripVertical,
  StickyNote,
  PencilLine,
  UserRound,
} from 'lucide-react'
import { PageHeader } from '../components/common/PageHeader'
import { MetricStrip } from '../components/common/MetricStrip'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { Modal } from '../components/ui/modal'
import { useToast } from '../state/ToastContext'
import { useResource } from '../hooks/useResource'
import type { EmergencyCase, EmergencyStatus, EmergencySeverity } from '../types'

const columns: EmergencyStatus[] = ['Incoming', 'Triage', 'In Treatment', 'Stabilized', 'Discharged']
const severities: EmergencySeverity[] = ['Critical', 'High', 'Moderate', 'Low']

const severityText: Record<EmergencySeverity, string> = {
  Critical: 'text-[#b42318]',
  High: 'text-[#b54708]',
  Moderate: 'text-[#175cd3]',
  Low: 'text-[#027a48]',
}

const severityDot: Record<EmergencySeverity, string> = {
  Critical: 'bg-[#d92d20]',
  High: 'bg-[#dc6803]',
  Moderate: 'bg-[#2563eb]',
  Low: 'bg-[#039855]',
}

const columnDot: Record<EmergencyStatus, string> = {
  Incoming: 'bg-[#2563eb]',
  Triage: 'bg-[#dc6803]',
  'In Treatment': 'bg-[#d92d20]',
  Stabilized: 'bg-[#039855]',
  Discharged: 'bg-[#98a2b3]',
}

const emptyForm = {
  patientName: '',
  age: '30',
  condition: '',
  severity: 'Moderate' as EmergencySeverity,
  assignedDoctor: '',
  notes: '',
}

export default function Emergency() {
  const toast = useToast()
  const { items, create, update } = useResource('emergencyCases')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<EmergencyStatus | null>(null)
  const [active, setActive] = useState<EmergencyCase | null>(null)
  const [notesDraft, setNotesDraft] = useState('')
  const [stageDraft, setStageDraft] = useState<EmergencyStatus>('Incoming')

  const activeCases = items.filter((c) => c.status !== 'Discharged')
  const critical = items.filter((c) => c.severity === 'Critical' && c.status !== 'Discharged').length

  const moveCase = (c: EmergencyCase, status: EmergencyStatus) => {
    if (c.status === status) return
    update(c.id, { status })
    toast.success('Case moved', `${c.patientName} moved to ${status}.`)
  }

  const advance = (c: EmergencyCase) => {
    const idx = columns.indexOf(c.status)
    if (idx < columns.length - 1) moveCase(c, columns[idx + 1])
  }

  const openNotes = (c: EmergencyCase) => {
    setActive(c)
    setNotesDraft(c.notes ?? '')
    setStageDraft(c.status)
  }

  const saveNotes = () => {
    if (!active) return
    update(active.id, { notes: notesDraft.trim(), status: stageDraft })
    toast.success('Case updated', `Note saved for ${active.patientName}.`)
    setActive(null)
  }

  const startDrag = (event: React.DragEvent, c: EmergencyCase) => {
    setDraggingId(c.id)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', c.id)
  }

  const endDrag = () => {
    setDraggingId(null)
    setDragOver(null)
  }

  const dropOn = (event: React.DragEvent, status: EmergencyStatus) => {
    event.preventDefault()
    const id = event.dataTransfer.getData('text/plain') || draggingId
    endDrag()
    if (!id) return
    const c = items.find((item) => item.id === id)
    if (c) moveCase(c, status)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.patientName.trim() || !form.condition.trim()) {
      toast.error('Patient name and condition are required')
      return
    }
    create({
      patientName: form.patientName,
      age: Number(form.age),
      condition: form.condition,
      severity: form.severity,
      arrivedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      assignedDoctor: form.assignedDoctor || 'Unassigned',
      status: 'Incoming',
      notes: form.notes.trim() || undefined,
    })
    toast.success('Emergency case created', `${form.patientName} added to the triage queue.`)
    setFormOpen(false)
    setForm(emptyForm)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        variant="compact"
        eyebrow="Emergency department"
        title="Emergency Triage"
        description="Drag cases between stages as care progresses. Open a card note to record clinical context or change stage on touch."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus size={15} /> New case
          </Button>
        }
      />

      <MetricStrip
        columns={4}
        items={[
          { label: 'Active cases', value: activeCases.length, note: 'in the pathway', icon: Siren, tone: 'text-[#b42318]' },
          { label: 'Critical', value: critical, note: 'need immediate review', icon: Siren, tone: 'text-[#b42318]' },
          {
            label: 'In treatment',
            value: items.filter((c) => c.status === 'In Treatment').length,
            note: 'currently with clinicians',
          },
          {
            label: 'Discharged',
            value: items.filter((c) => c.status === 'Discharged').length,
            note: 'completed today',
          },
        ]}
      />

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {columns.map((col) => {
          const cards = items.filter((c) => c.status === col)
          const isOver = dragOver === col
          return (
            <section
              key={col}
              onDragEnter={(event) => {
                event.preventDefault()
                setDragOver(col)
              }}
              onDragOver={(event) => {
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
                if (dragOver !== col) setDragOver(col)
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragOver(null)
              }}
              onDrop={(event) => dropOn(event, col)}
              className={`flex w-[264px] shrink-0 flex-col rounded-xl border transition-colors 2xl:w-auto 2xl:flex-1 ${
                isOver ? 'border-primary-border bg-primary-light/50' : 'border-border bg-surface-muted/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${columnDot[col]}`} />
                  <p className="truncate text-[12.5px] font-semibold text-text-primary">{col}</p>
                </div>
                <span className="rounded bg-white px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-text-secondary">
                  {cards.length}
                </span>
              </div>

              <div className="flex-1 space-y-2 p-2">
                {cards.map((c) => (
                  <article
                    key={c.id}
                    draggable
                    onDragStart={(event) => startDrag(event, c)}
                    onDragEnd={endDrag}
                    onClick={() => openNotes(c)}
                    className={`group cursor-grab rounded-lg border border-border bg-white p-3 transition-all hover:border-border-strong hover:shadow-sm active:cursor-grabbing ${
                      draggingId === c.id ? 'opacity-40' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-semibold text-text-primary">{c.patientName}</p>
                        <p className="text-[11px] text-text-tertiary">{c.age} years</p>
                      </div>
                      <span className={`flex shrink-0 items-center gap-1 text-[10.5px] font-medium ${severityText[c.severity]}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${severityDot[c.severity]}`} />
                        {c.severity}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 text-[11.5px] leading-4 text-text-secondary">{c.condition}</p>

                    {c.notes && (
                      <div className="mt-2 rounded-md border border-border bg-surface-muted px-2 py-1.5">
                        <div className="flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-[0.07em] text-text-tertiary">
                          <StickyNote size={10} /> Note
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-text-secondary">{c.notes}</p>
                      </div>
                    )}

                    <div className="mt-2 flex items-center justify-between gap-2 text-[10.5px] text-text-tertiary">
                      <span className="flex min-w-0 items-center gap-1">
                        <UserRound size={11} className="shrink-0" />
                        <span className="truncate">{c.assignedDoctor}</span>
                      </span>
                      <span className="shrink-0">Arrived {c.arrivedAt}</span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between gap-1 border-t border-border pt-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          openNotes(c)
                        }}
                        className="inline-flex items-center gap-1 text-[10.5px] font-medium text-text-secondary transition-colors hover:text-primary"
                      >
                        <PencilLine size={11} /> {c.notes ? 'Edit note' : 'Add note'}
                      </button>
                      <div className="flex items-center gap-1">
                        {c.status !== 'Discharged' && (
                          <button
                            type="button"
                            title="Advance stage"
                            aria-label={`Advance ${c.patientName} to the next stage`}
                            onClick={(event) => {
                              event.stopPropagation()
                              advance(c)
                            }}
                            className="rounded p-1 text-text-tertiary transition-colors hover:bg-primary-light hover:text-primary"
                          >
                            <ArrowRight size={12} />
                          </button>
                        )}
                        <GripVertical size={13} className="text-text-tertiary" aria-hidden="true" />
                      </div>
                    </div>
                  </article>
                ))}

                <div
                  className={`rounded-lg border border-dashed py-6 text-center text-[11.5px] transition-colors ${
                    isOver ? 'border-primary bg-white/70 text-primary' : 'border-border text-text-tertiary'
                  }`}
                >
                  {isOver ? 'Drop case here' : cards.length === 0 ? 'No cases' : 'Drop here to move'}
                </div>
              </div>
            </section>
          )
        })}
      </div>

      <Modal
        open={Boolean(active)}
        onClose={() => setActive(null)}
        title={active ? `${active.patientName} · case note` : 'Case note'}
        description={active ? `${active.condition} · ${active.severity} severity` : undefined}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setActive(null)}>Cancel</Button>
            <Button onClick={saveNotes}>Save note</Button>
          </>
        }
      >
        {active && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-surface-muted px-3 py-2.5">
              <div>
                <p className="label-micro">Age</p>
                <p className="mt-0.5 text-[13px] text-text-primary">{active.age} years</p>
              </div>
              <div>
                <p className="label-micro">Arrived</p>
                <p className="mt-0.5 text-[13px] text-text-primary">{active.arrivedAt}</p>
              </div>
            </div>

            <Select
              label="Stage"
              value={stageDraft}
              onChange={(event) => setStageDraft(event.target.value as EmergencyStatus)}
            >
              {columns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </Select>

            <Textarea
              label="Clinical note"
              value={notesDraft}
              onChange={(event) => setNotesDraft(event.target.value)}
              placeholder="Handover, interventions, observations, next review…"
            />

            <p className="text-[11.5px] text-text-tertiary">Assigned to {active.assignedDoctor}</p>
          </div>
        )}
      </Modal>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="New emergency case"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={submit}>Create case</Button>
          </>
        }
      >
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Patient name" required value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} placeholder="e.g. John Carter" />
          <Input label="Age" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
          <Select label="Severity" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as EmergencySeverity })}>
            {severities.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Input label="Assigned doctor" value={form.assignedDoctor} onChange={(e) => setForm({ ...form, assignedDoctor: e.target.value })} placeholder="e.g. Dr. Jane Doe" />
          <div className="sm:col-span-2">
            <Input label="Condition" required value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} placeholder="Presenting complaint" />
          </div>
          <div className="sm:col-span-2">
            <Textarea
              label="Initial note"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Triage observations, interventions, handover…"
            />
          </div>
          <button type="submit" className="hidden" aria-hidden="true" />
        </form>
      </Modal>
    </div>
  )
}
