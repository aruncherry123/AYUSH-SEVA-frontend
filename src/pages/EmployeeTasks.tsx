import { useMemo, useState } from 'react'
import { ListChecks, Plus, Eye, Pencil, Trash2, Clock3, CheckCircle2, AlertTriangle } from 'lucide-react'
import { PageHeader } from '../components/common/PageHeader'
import { MetricStrip } from '../components/common/MetricStrip'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Select } from '../components/ui/select'
import { Modal } from '../components/ui/modal'
import { Drawer } from '../components/ui/drawer'
import { ConfirmDialog } from '../components/ui/confirm-dialog'
import { DataTable, type Column } from '../components/ui/data-table'
import { Tabs } from '../components/ui/tabs'
import { StatusBadge } from '../utils/status'
import { useStore } from '../state/StoreContext'
import { useAuth } from '../state/AuthContext'
import { useToast } from '../state/ToastContext'
import { TODAY } from '../data/mockData'
import { formatDate } from '../utils/format'
import type { Priority, Task, TaskStatus } from '../types'

const departments = [
  'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Surgery', 'Emergency',
  'ICU', 'Radiology', 'Pharmacy', 'Administration', 'Housekeeping',
]
const priorities: Priority[] = ['High', 'Medium', 'Low']
const allStatuses: TaskStatus[] = ['Assigned', 'In Progress', 'Completed', 'Pending', 'Overdue', 'Cancelled']
const workerStatuses: TaskStatus[] = ['Assigned', 'In Progress', 'Completed', 'Pending', 'Cancelled']

const priorityTone: Record<Priority, string> = {
  High: 'bg-[#fef3f2] text-[#b42318]',
  Medium: 'bg-[#fffaeb] text-[#b54708]',
  Low: 'bg-[#ecfdf3] text-[#027a48]',
}

const isOverdue = (task: Task) =>
  task.status !== 'Completed' && task.status !== 'Cancelled' && task.dueDate < TODAY

interface TaskForm {
  title: string
  assignedTo: string
  department: string
  priority: Priority
  status: TaskStatus
  dueDate: string
  description: string
}

export default function EmployeeTasks() {
  const { db, create, update, remove } = useStore()
  const { user, can } = useAuth()
  const toast = useToast()
  const canManage = can('workforce.manage') || can('workforce.approve')

  const [tab, setTab] = useState<'active' | 'all'>('active')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [form, setForm] = useState<TaskForm>({
    title: '',
    assignedTo: '',
    department: departments[0],
    priority: 'Medium',
    status: 'Assigned',
    dueDate: TODAY,
    description: '',
  })
  const [error, setError] = useState('')
  const [detail, setDetail] = useState<Task | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null)

  const members = useMemo(
    () => db.users.filter((member) => member.organizationId === user?.organizationId && member.status === 'Active'),
    [db.users, user?.organizationId],
  )

  const orgTasks = useMemo(
    () => db.tasks.filter((task) => task.organizationId === user?.organizationId),
    [db.tasks, user?.organizationId],
  )

  const scoped = useMemo(() => {
    if (!user) return []
    if (canManage) return orgTasks
    return orgTasks.filter((task) => task.assignedToId === user.id || task.assignedTo === user.name)
  }, [canManage, orgTasks, user])

  const rows = useMemo(
    () =>
      [...scoped]
        .filter((task) => (tab === 'active' ? task.status !== 'Completed' && task.status !== 'Cancelled' : true))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title)),
    [scoped, tab],
  )

  const counts = useMemo(
    () => ({
      mine: orgTasks.filter((task) => task.assignedToId === user?.id).length,
      open: orgTasks.filter((task) => task.status !== 'Completed' && task.status !== 'Cancelled').length,
      overdue: orgTasks.filter(isOverdue).length,
      completed: orgTasks.filter((task) => task.status === 'Completed').length,
    }),
    [orgTasks, user?.id],
  )

  const canUpdate = (task: Task) =>
    canManage || task.assignedToId === user?.id || task.assignedTo === user?.name

  const assignee = (name: string) => members.find((member) => member.name === name)

  const openCreate = () => {
    const first = members[0]
    setEditing(null)
    setForm({
      title: '',
      assignedTo: first?.name ?? '',
      department: first?.department ?? departments[0],
      priority: 'Medium',
      status: 'Assigned',
      dueDate: TODAY,
      description: '',
    })
    setError('')
    setFormOpen(true)
  }

  const openEdit = (task: Task) => {
    if (!canManage) return
    setEditing(task)
    setForm({
      title: task.title,
      assignedTo: task.assignedTo,
      department: task.department,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      description: task.description,
    })
    setError('')
    setFormOpen(true)
    setDetail(null)
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!form.title.trim()) {
      setError('Give the task a clear title.')
      return
    }
    if (!form.assignedTo) {
      setError('Choose who is responsible for this task.')
      return
    }
    if (!form.dueDate) {
      setError('Set a due date.')
      return
    }
    const person = assignee(form.assignedTo)
    if (editing) {
      update('tasks', editing.id, {
        title: form.title.trim(),
        assignedTo: form.assignedTo,
        assignedToId: person?.id ?? editing.assignedToId,
        branchId: person?.branchId ?? editing.branchId,
        department: form.department,
        priority: form.priority,
        status: form.status,
        dueDate: form.dueDate,
        description: form.description.trim(),
        completedAt: form.status === 'Completed' ? editing.completedAt ?? TODAY : undefined,
      })
      toast.success('Task updated', form.title.trim())
    } else {
      create('tasks', {
        organizationId: user?.organizationId ?? '',
        branchId: person?.branchId ?? user?.branchId ?? '',
        title: form.title.trim(),
        assignedTo: form.assignedTo,
        assignedToId: person?.id,
        assignedBy: user?.name,
        priority: form.priority,
        status: form.status,
        dueDate: form.dueDate,
        department: form.department,
        description: form.description.trim(),
        createdAt: TODAY,
      })
      toast.success('Task assigned', `${form.title.trim()} → ${form.assignedTo}`)
    }
    setFormOpen(false)
  }

  const setStatus = (task: Task, status: TaskStatus) => {
    if (!canUpdate(task)) {
      toast.error('You can only update tasks assigned to you')
      return
    }
    update('tasks', task.id, {
      status,
      completedAt: status === 'Completed' ? TODAY : undefined,
    })
    setDetail((prev) => (prev && prev.id === task.id ? { ...prev, status } : prev))
    toast.success('Status updated', `${task.title} is now ${status.toLowerCase()}.`)
  }

  const columns: Column<Task>[] = [
    {
      key: 'title',
      header: 'Task',
      sortable: true,
      render: (task) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-text-primary">{task.title}</p>
          <p className="truncate text-[11.5px] text-text-tertiary">{task.department}</p>
        </div>
      ),
    },
    ...(canManage
      ? [
          {
            key: 'assignedTo',
            header: 'Assigned to',
            sortable: true,
            hideOnMobile: true,
            render: (task: Task) => <span className="text-text-secondary">{task.assignedTo}</span>,
          },
        ]
      : []),
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (task) => (
        <span className={`inline-flex whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-4 ${priorityTone[task.priority]}`}>
          {task.priority}
        </span>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due',
      sortable: true,
      render: (task) => (
        <span className={`whitespace-nowrap tabular-nums ${isOverdue(task) ? 'font-medium text-error' : 'text-text-secondary'}`}>
          {formatDate(task.dueDate)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (task) => <StatusBadge status={task.status} />,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        variant="compact"
        eyebrow="Workforce · task board"
        title="Tasks"
        description={
          canManage
            ? 'Assign work with clear priorities and deadlines, then track progress as it moves.'
            : 'Your assigned work, ordered by deadline. Update the status as you make progress.'
        }
        actions={
          canManage ? (
            <Button onClick={openCreate}>
              <Plus size={15} /> New task
            </Button>
          ) : undefined
        }
      />

      <MetricStrip
        columns={4}
        items={[
          {
            label: canManage ? 'Open tasks' : 'Assigned to me',
            value: canManage ? counts.open : scoped.filter((task) => task.status !== 'Completed' && task.status !== 'Cancelled').length,
            note: canManage ? 'across the organisation' : 'still in progress',
            icon: ListChecks,
          },
          {
            label: 'Overdue',
            value: scoped.filter(isOverdue).length,
            note: 'past their due date',
            icon: AlertTriangle,
            tone: 'text-[#b42318]',
          },
          {
            label: 'Due today',
            value: scoped.filter((task) => task.dueDate === TODAY && task.status !== 'Completed' && task.status !== 'Cancelled').length,
            note: 'finish before end of day',
            icon: Clock3,
            tone: 'text-[#b54708]',
          },
          {
            label: 'Completed',
            value: scoped.filter((task) => task.status === 'Completed').length,
            note: canManage ? `${orgTasks.length} total tasks` : 'of your tasks',
            icon: CheckCircle2,
            tone: 'text-[#027a48]',
          },
        ]}
      />

      <div className="space-y-4">
        <Tabs
          tabs={[
            {
              id: 'active',
              label: 'Open',
              count: scoped.filter((task) => task.status !== 'Completed' && task.status !== 'Cancelled').length,
            },
            { id: 'all', label: canManage ? 'All tasks' : 'All my tasks', count: scoped.length },
          ]}
          active={tab}
          onChange={(id) => setTab(id as 'active' | 'all')}
          variant="underline"
        />

        <Card className="overflow-hidden">
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(task) => task.id}
            pageSize={8}
            density="compact"
            emptyTitle={tab === 'active' ? 'Nothing open right now' : 'No tasks yet'}
            emptyDescription={
              tab === 'active'
                ? canManage
                  ? 'Assign a task to get the team moving.'
                  : 'You have no open work. Completed tasks stay on file.'
                : canManage
                  ? 'Tasks you assign will be listed here with their progress.'
                  : 'Tasks assigned to you will appear here.'
            }
            onRowClick={(task) => setDetail(task)}
            actions={(task) => (
              <>
                <button
                  onClick={() => setDetail(task)}
                  className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-bg-secondary hover:text-primary"
                  aria-label={`View ${task.title}`}
                >
                  <Eye size={14} />
                </button>
                {canManage && (
                  <>
                    <button
                      onClick={() => openEdit(task)}
                      className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-bg-secondary hover:text-primary"
                      aria-label={`Edit ${task.title}`}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setPendingDelete(task)}
                      className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-[#fef3f2] hover:text-error"
                      aria-label={`Delete ${task.title}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </>
            )}
          />
        </Card>
      </div>

      {/* Detail + status update */}
      <Drawer
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title="Task details"
        width="md"
        footer={
          detail && (
            <Button variant="outline" onClick={() => setDetail(null)}>
              Close
            </Button>
          )
        }
      >
        {detail && (
          <div className="space-y-5">
            <div>
              <p className="font-display text-[18px] font-semibold leading-6 tracking-[-0.02em] text-text-primary">
                {detail.title}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`inline-flex whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-4 ${priorityTone[detail.priority]}`}>
                  {detail.priority} priority
                </span>
                <StatusBadge status={detail.status} />
                {isOverdue(detail) && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#fef3f2] px-1.5 py-0.5 text-[11px] font-medium text-[#b42318]">
                    <AlertTriangle size={11} /> Overdue
                  </span>
                )}
              </div>
            </div>

            <dl className="divide-y divide-border border-y border-border">
              {[
                ['Assigned to', detail.assignedTo],
                ['Assigned by', detail.assignedBy ?? '—'],
                ['Department', detail.department],
                ['Due date', formatDate(detail.dueDate)],
                ['Created', detail.createdAt ? formatDate(detail.createdAt) : '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4 py-2.5">
                  <dt className="text-[12px] text-text-secondary">{label}</dt>
                  <dd className="text-right text-[12.5px] font-medium text-text-primary">{value}</dd>
                </div>
              ))}
            </dl>

            <div>
              <p className="label-micro">Description</p>
              <p className="mt-1.5 text-[12.5px] leading-6 text-text-secondary">
                {detail.description || 'No description was added for this task.'}
              </p>
            </div>

            {canUpdate(detail) && (
              <div className="rounded-lg border border-border bg-surface-muted px-3.5 py-3">
                <p className="text-[12px] font-medium text-text-primary">Update status</p>
                <p className="mt-0.5 text-[11px] text-text-secondary">
                  Only the assignee or an administrator can move this task.
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {workerStatuses.map((status) => {
                    const active = detail.status === status
                    return (
                      <button
                        key={status}
                        onClick={() => setStatus(detail, status)}
                        aria-pressed={active}
                        className={`rounded-md border px-2 py-1 text-[11.5px] font-medium transition-colors ${
                          active
                            ? 'border-primary-border bg-primary-light text-primary'
                            : 'border-border bg-white text-text-secondary hover:border-border-strong hover:text-text-primary'
                        }`}
                      >
                        {status}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {canManage && (
              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <Button variant="outline" size="sm" onClick={() => openEdit(detail)}>
                  <Pencil size={14} /> Edit task
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-error hover:bg-[#fef3f2]"
                  onClick={() => {
                    setPendingDelete(detail)
                    setDetail(null)
                  }}
                >
                  <Trash2 size={14} /> Delete
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Create / edit */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit task' : 'New task'}
        description={
          editing
            ? 'Update ownership, priority or the deadline.'
            : 'Assign work to a member with a priority, deadline and clear expectation.'
        }
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>{editing ? 'Save changes' : 'Assign task'}</Button>
          </>
        }
      >
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Task title"
              required
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Restock emergency crash cart"
            />
          </div>
          <Select
            label="Assign to"
            value={form.assignedTo}
            onChange={(event) => {
              const person = assignee(event.target.value)
              setForm((prev) => ({
                ...prev,
                assignedTo: event.target.value,
                department: person?.department ?? prev.department,
              }))
            }}
          >
            {members.map((member) => (
              <option key={member.id} value={member.name}>
                {member.name} · {member.department}
              </option>
            ))}
          </Select>
          <Select
            label="Department"
            value={form.department}
            onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))}
          >
            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </Select>
          <Select
            label="Priority"
            value={form.priority}
            onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value as Priority }))}
          >
            {priorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </Select>
          <Input
            label="Due date"
            type="date"
            required
            value={form.dueDate}
            onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
          />
          <div className="sm:col-span-2">
            <Select
              label="Status"
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as TaskStatus }))}
            >
              {allStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Textarea
              label="Description"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="What needs to happen, and what good looks like"
            />
          </div>
          {error && (
            <p role="alert" className="sm:col-span-2 rounded-lg bg-[#fef3f2] px-3 py-2 text-[12px] leading-5 text-[#b42318]">
              {error}
            </p>
          )}
          <button type="submit" className="hidden" aria-hidden="true" />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            remove('tasks', pendingDelete.id)
            toast.success('Task deleted', pendingDelete.title)
          }
          setPendingDelete(null)
        }}
        title="Delete task?"
        message={
          pendingDelete
            ? `${pendingDelete.title} will be removed from the board. This cannot be undone.`
            : ''
        }
      />
    </div>
  )
}
