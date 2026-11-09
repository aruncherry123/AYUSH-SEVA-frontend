import { useMemo, useState } from 'react'
import {
  CalendarOff,
  CalendarCheck,
  CalendarDays,
  Check,
  X,
  Plus,
  Coffee,
  Users,
  ShieldCheck,
} from 'lucide-react'
import { PageHeader } from '../components/common/PageHeader'
import { MetricStrip } from '../components/common/MetricStrip'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Select } from '../components/ui/select'
import { Modal } from '../components/ui/modal'
import { DataTable, type Column } from '../components/ui/data-table'
import { Tabs } from '../components/ui/tabs'
import { StatusBadge } from '../utils/status'
import { useStore } from '../state/StoreContext'
import { useAuth } from '../state/AuthContext'
import { useToast } from '../state/ToastContext'
import { TODAY } from '../data/mockData'
import { formatDate } from '../utils/format'
import type { LeaveRequest, LeaveType } from '../types'

const leaveTypes: LeaveType[] = ['Sick', 'Casual', 'Annual', 'Maternity', 'Unpaid']
const YEAR = TODAY.slice(0, 4)

const ENTITLEMENT: Record<LeaveType, number> = {
  Sick: 12,
  Casual: 10,
  Annual: 18,
  Maternity: 90,
  Unpaid: 0,
}

const addDays = (date: string, offset: number) => {
  const base = new Date(`${date}T00:00:00Z`)
  base.setUTCDate(base.getUTCDate() + offset)
  return base.toISOString().slice(0, 10)
}

const isWeekday = (date: string) => {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay()
  return day !== 0 && day !== 6
}

const workingDays = (from: string, to: string) => {
  if (!from || !to || to < from) return 0
  let count = 0
  for (let date = from; date <= to; date = addDays(date, 1)) {
    if (isWeekday(date)) count++
  }
  return count
}

const rangeLabel = (leave: Pick<LeaveRequest, 'from' | 'to'>) =>
  leave.from === leave.to ? formatDate(leave.from) : `${formatDate(leave.from)} – ${formatDate(leave.to)}`

const typeTone: Record<LeaveType, string> = {
  Sick: 'bg-[#fef3f2] text-[#b42318]',
  Casual: 'bg-[#eff4ff] text-[#175cd3]',
  Annual: 'bg-[#ecfdf3] text-[#027a48]',
  Maternity: 'bg-primary-light text-primary',
  Unpaid: 'bg-bg-secondary text-text-secondary',
}

interface ApplyForm {
  type: LeaveType
  from: string
  to: string
  reason: string
}

const emptyApply: ApplyForm = { type: 'Casual', from: '', to: '', reason: '' }

export default function Leave() {
  const { db, create, update } = useStore()
  const { user, can } = useAuth()
  const toast = useToast()

  const canApprove = can('workforce.approve') || can('workforce.manage')
  const [tab, setTab] = useState<'pending' | 'history'>('pending')
  const [applyOpen, setApplyOpen] = useState(false)
  const [applyForm, setApplyForm] = useState<ApplyForm>(emptyApply)
  const [applyError, setApplyError] = useState('')
  const [saving, setSaving] = useState(false)
  const [review, setReview] = useState<{ leave: LeaveRequest; mode: 'approve' | 'reject' } | null>(null)
  const [reviewNote, setReviewNote] = useState('')

  const orgLeaves = useMemo(
    () => db.leaves.filter((leave) => leave.organizationId === user?.organizationId),
    [db.leaves, user?.organizationId],
  )

  const myLeaves = useMemo(
    () => orgLeaves.filter((leave) => leave.userId === user?.id),
    [orgLeaves, user?.id],
  )

  /** Managers approve across the organisation; everyone else only ever sees their own file. */
  const visible = canApprove ? orgLeaves : myLeaves
  const rows = useMemo(
    () =>
      [...visible]
        .filter((leave) => (tab === 'pending' ? leave.status === 'Pending' : true))
        .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt) || b.from.localeCompare(a.from)),
    [tab, visible],
  )

  const approvedThisYear = myLeaves.filter(
    (leave) => leave.status === 'Approved' && leave.from.startsWith(YEAR),
  )
  const approvedDays = approvedThisYear.reduce((sum, leave) => sum + leave.days, 0)

  const onLeaveToday = useMemo(
    () =>
      (canApprove ? orgLeaves : myLeaves).filter(
        (leave) => leave.status === 'Approved' && leave.from <= TODAY && leave.to >= TODAY,
      ),
    [canApprove, myLeaves, orgLeaves],
  )

  const upcoming = useMemo(
    () =>
      [...myLeaves]
        .filter((leave) => (leave.status === 'Approved' || leave.status === 'Pending') && leave.from > TODAY)
        .sort((a, b) => a.from.localeCompare(b.from))[0],
    [myLeaves],
  )

  const balances = useMemo(
    () =>
      leaveTypes.map((type) => {
        const used = myLeaves
          .filter((leave) => leave.type === type && leave.status === 'Approved' && leave.from.startsWith(YEAR))
          .reduce((sum, leave) => sum + leave.days, 0)
        const entitlement = ENTITLEMENT[type]
        return {
          type,
          used,
          entitlement,
          remaining: entitlement === 0 ? null : Math.max(0, entitlement - used),
          ratio: entitlement === 0 ? 0 : Math.min(1, used / entitlement),
        }
      }),
    [myLeaves],
  )

  const computedDays = workingDays(applyForm.from, applyForm.to)

  const setApply = (key: keyof ApplyForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setApplyForm((prev) => ({ ...prev, [key]: event.target.value }))

  const openApply = () => {
    setApplyForm(emptyApply)
    setApplyError('')
    setApplyOpen(true)
  }

  const submitApply = (event: React.FormEvent) => {
    event.preventDefault()
    setApplyError('')
    if (!user) return
    if (!applyForm.from || !applyForm.to) {
      setApplyError('Choose a start and end date for the leave.')
      return
    }
    if (applyForm.to < applyForm.from) {
      setApplyError('The end date must fall on or after the start date.')
      return
    }
    if (computedDays === 0) {
      setApplyError('That range contains no working days. Choose at least one weekday.')
      return
    }
    if (applyForm.reason.trim().length < 4) {
      setApplyError('Add a short reason so the approver has context.')
      return
    }
    setSaving(true)
    create('leaves', {
      organizationId: user.organizationId,
      branchId: user.branchId,
      userId: user.id,
      employee: user.name,
      department: user.department,
      type: applyForm.type,
      from: applyForm.from,
      to: applyForm.to,
      days: computedDays,
      reason: applyForm.reason.trim(),
      status: 'Pending',
      appliedAt: TODAY,
    })
    setSaving(false)
    setApplyOpen(false)
    setTab('pending')
    toast.success('Leave requested', `${computedDays} working day${computedDays === 1 ? '' : 's'} sent for approval.`)
  }

  /** Approved leave is written into the attendance register so hours and status stay consistent. */
  const syncAttendance = (leave: LeaveRequest) => {
    if (!isWeekday(leave.from) && workingDays(leave.from, leave.to) === 0) return
    for (let date = leave.from; date <= leave.to; date = addDays(date, 1)) {
      if (!isWeekday(date)) continue
      const existing = db.attendance.find((row) => row.userId === leave.userId && row.date === date)
      if (existing) {
        update('attendance', existing.id, {
          status: 'On Leave',
          checkIn: '—',
          checkOut: '—',
          workedHours: 0,
        })
      } else {
        create('attendance', {
          organizationId: leave.organizationId,
          branchId: leave.branchId,
          userId: leave.userId,
          employee: leave.employee,
          department: leave.department,
          date,
          checkIn: '—',
          checkOut: '—',
          status: 'On Leave',
          workedHours: 0,
        })
      }
    }
  }

  const clearAttendance = (leave: LeaveRequest) => {
    db.attendance
      .filter(
        (row) =>
          row.userId === leave.userId &&
          row.date >= leave.from &&
          row.date <= leave.to &&
          row.status === 'On Leave',
      )
      .forEach((row) =>
        update('attendance', row.id, { status: 'Absent', checkIn: '—', checkOut: '—', workedHours: 0 }),
      )
  }

  const confirmReview = () => {
    if (!review) return
    const { leave, mode } = review
    const approved = mode === 'approve'
    update('leaves', leave.id, {
      status: approved ? 'Approved' : 'Rejected',
      reviewedBy: user?.name ?? 'Administrator',
      reviewedAt: TODAY,
      reviewNote: reviewNote.trim() || undefined,
    })
    if (approved) syncAttendance(leave)
    else if (leave.status === 'Approved') clearAttendance(leave)
    setReview(null)
    setReviewNote('')
    toast.success(
      approved ? 'Leave approved' : 'Leave rejected',
      approved
        ? `${leave.employee}'s attendance now shows On Leave for ${leave.days} day${leave.days === 1 ? '' : 's'}.`
        : `${leave.employee} has been notified.`,
    )
  }

  const cancelMine = (leave: LeaveRequest) => {
    update('leaves', leave.id, { status: 'Cancelled' })
    if (leave.status === 'Approved') clearAttendance(leave)
    toast.success('Leave cancelled', rangeLabel(leave))
  }

  const canCancel = (leave: LeaveRequest) =>
    leave.userId === user?.id && (leave.status === 'Pending' || (leave.status === 'Approved' && leave.from > TODAY))

  const columns: Column<LeaveRequest>[] = [
    ...(canApprove
      ? [
          {
            key: 'employee',
            header: 'Member',
            sortable: true,
            render: (leave: LeaveRequest) => (
              <div className="min-w-0">
                <p className="truncate font-medium text-text-primary">{leave.employee}</p>
                <p className="truncate text-[11.5px] text-text-tertiary">{leave.department}</p>
              </div>
            ),
          },
        ]
      : []),
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (leave) => (
        <span className={`inline-flex whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-4 ${typeTone[leave.type]}`}>
          {leave.type}
        </span>
      ),
    },
    {
      key: 'from',
      header: 'Dates',
      sortable: true,
      render: (leave) => (
        <span className="whitespace-nowrap text-text-secondary">{rangeLabel(leave)}</span>
      ),
    },
    {
      key: 'days',
      header: 'Days',
      sortable: true,
      align: 'center',
      render: (leave) => <span className="tabular-nums text-text-secondary">{leave.days}</span>,
    },
    {
      key: 'reason',
      header: 'Reason',
      hideOnMobile: true,
      render: (leave) => (
        <span className="block max-w-[220px] truncate text-text-secondary" title={leave.reason}>
          {leave.reason || '—'}
        </span>
      ),
    },
    {
      key: 'appliedAt',
      header: 'Applied',
      sortable: true,
      hideOnMobile: true,
      render: (leave) => <span className="whitespace-nowrap text-text-secondary">{formatDate(leave.appliedAt)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (leave) => (
        <div className="flex flex-col gap-1">
          <StatusBadge status={leave.status} />
          {leave.reviewNote && leave.status !== 'Pending' && (
            <span className="block max-w-[180px] truncate text-[10.5px] text-text-tertiary" title={leave.reviewNote}>
              {leave.reviewNote}
            </span>
          )}
        </div>
      ),
    },
  ]

  const hasActions = canApprove ? rows.some((leave) => leave.status === 'Pending') : rows.some(canCancel)

  return (
    <div className="space-y-6">
      <PageHeader
        variant="compact"
        eyebrow="Workforce · leave"
        title="Leave"
        description={
          canApprove
            ? 'Review applications, approve time off and keep the attendance register in step.'
            : 'Apply for time off, follow each request and see what remains in your balance.'
        }
        actions={
          <Button onClick={openApply}>
            <Plus size={15} /> Apply for leave
          </Button>
        }
      />

      <MetricStrip
        columns={4}
        items={[
          {
            label: canApprove ? 'Pending approval' : 'Awaiting review',
            value: (canApprove ? orgLeaves : myLeaves).filter((leave) => leave.status === 'Pending').length,
            note: canApprove ? 'across the organisation' : 'of your requests',
            icon: CalendarOff,
            tone: 'text-[#b54708]',
          },
          {
            label: 'Approved this year',
            value: `${approvedDays} d`,
            note: 'your approved leave',
            icon: CalendarCheck,
            tone: 'text-[#027a48]',
          },
          {
            label: 'On leave today',
            value: onLeaveToday.length,
            note: canApprove ? 'members away today' : 'including you',
            icon: Coffee,
            tone: 'text-[#175cd3]',
          },
          {
            label: 'Next leave',
            value: upcoming ? formatDate(upcoming.from) : '—',
            note: upcoming ? `${upcoming.type} · ${upcoming.days} day${upcoming.days === 1 ? '' : 's'}` : 'nothing scheduled',
            icon: CalendarDays,
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_290px]">
        <div className="min-w-0 space-y-4">
          <Tabs
            tabs={[
              {
                id: 'pending',
                label: canApprove ? 'Awaiting approval' : 'Pending',
                count: (canApprove ? orgLeaves : myLeaves).filter((leave) => leave.status === 'Pending').length,
              },
              {
                id: 'history',
                label: canApprove ? 'All requests' : 'My requests',
                count: visible.length,
              },
            ]}
            active={tab}
            onChange={(id) => setTab(id as 'pending' | 'history')}
            variant="underline"
          />

          <Card className="overflow-hidden">
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(leave) => leave.id}
              pageSize={8}
              density="compact"
              emptyTitle={tab === 'pending' ? 'Nothing waiting for review' : 'No leave requests yet'}
              emptyDescription={
                tab === 'pending'
                  ? canApprove
                    ? 'New applications will appear here for approval.'
                    : 'Your next request will appear here while it waits for approval.'
                  : canApprove
                    ? 'Approved, rejected and cancelled requests stay on file here.'
                    : 'Applications you submit will be listed here with their outcome.'
              }
              actions={
                hasActions
                  ? (leave) => (
                      <>
                        {canApprove && leave.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => {
                                setReview({ leave, mode: 'approve' })
                                setReviewNote('')
                              }}
                              className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-[#ecfdf3] hover:text-[#027a48]"
                              aria-label={`Approve leave for ${leave.employee}`}
                              title="Approve"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setReview({ leave, mode: 'reject' })
                                setReviewNote('')
                              }}
                              className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-[#fef3f2] hover:text-error"
                              aria-label={`Reject leave for ${leave.employee}`}
                              title="Reject"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}
                        {canCancel(leave) && (
                          <button
                            onClick={() => cancelMine(leave)}
                            className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-bg-secondary hover:text-error"
                            aria-label={`Cancel leave from ${leave.from}`}
                            title="Cancel request"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </>
                    )
                  : undefined
              }
            />
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <CalendarCheck size={15} className="text-text-tertiary" />
              <h2 className="text-[13px] font-semibold text-text-primary">Your leave balance</h2>
            </div>
            <p className="mt-1 text-[11.5px] text-text-secondary">Entitlement for {YEAR}, including approved leave.</p>
            <ul className="mt-3 space-y-2.5">
              {balances.map((balance) => (
                <li key={balance.type}>
                  <div className="flex items-center justify-between gap-2 text-[12px]">
                    <span className="text-text-secondary">{balance.type}</span>
                    <span className="font-medium tabular-nums text-text-primary">
                      {balance.remaining === null ? `${balance.used} d` : `${balance.remaining} left`}
                    </span>
                  </div>
                  {balance.remaining !== null && (
                    <>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-bg-secondary">
                        <div
                          className={`h-full rounded-full ${balance.ratio >= 0.85 ? 'bg-warning' : 'bg-primary'}`}
                          style={{ width: `${Math.max(4, balance.ratio * 100)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[10.5px] text-text-tertiary">
                        {balance.used} of {balance.entitlement} days used
                      </p>
                    </>
                  )}
                  {balance.remaining === null && (
                    <p className="mt-0.5 text-[10.5px] text-text-tertiary">Unpaid leave has no fixed entitlement</p>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          {canApprove && (
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-text-tertiary" />
                <h2 className="text-[13px] font-semibold text-text-primary">Away today</h2>
                <span className="ml-auto rounded-md bg-bg-secondary px-1.5 py-0.5 text-[10.5px] font-medium text-text-secondary">
                  {onLeaveToday.length}
                </span>
              </div>
              {onLeaveToday.length === 0 ? (
                <p className="mt-2 text-[11.5px] text-text-secondary">Everyone is available today.</p>
              ) : (
                <ul className="mt-2 divide-y divide-border">
                  {onLeaveToday.map((leave) => (
                    <li key={leave.id} className="flex items-center justify-between gap-2 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-medium text-text-primary">{leave.employee}</p>
                        <p className="truncate text-[10.5px] text-text-tertiary">{leave.department} · {leave.type}</p>
                      </div>
                      <span className="shrink-0 text-[10.5px] text-text-tertiary">until {formatDate(leave.to)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          <div className="flex items-start gap-2.5 rounded-lg border border-border bg-surface-muted px-3.5 py-3">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-text-tertiary" />
            <p className="text-[11px] leading-5 text-text-secondary">
              {canApprove
                ? 'Approving a request writes On Leave into the attendance register for every working day in the range.'
                : 'Approved leave is reflected in attendance automatically, so you do not need to check in on those days.'}
            </p>
          </div>
        </aside>
      </div>

      {/* Apply for leave */}
      <Modal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        title="Apply for leave"
        description="Requests go to your branch or organisation administrator for approval."
        footer={
          <>
            <Button variant="outline" onClick={() => setApplyOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitApply} loading={saving}>
              Submit request
            </Button>
          </>
        }
      >
        <form onSubmit={submitApply} className="space-y-4">
          <Select label="Leave type" value={applyForm.type} onChange={setApply('type')}>
            {leaveTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="From" type="date" value={applyForm.from} onChange={setApply('from')} required />
            <Input label="To" type="date" value={applyForm.to} onChange={setApply('to')} required />
          </div>
          <div className="rounded-lg border border-border bg-surface-muted px-3.5 py-2.5">
            <p className="text-[11.5px] text-text-secondary">
              <span className="font-medium text-text-primary">{computedDays}</span> working day
              {computedDays === 1 ? '' : 's'} will be requested. Weekends are not counted.
            </p>
          </div>
          <Textarea
            label="Reason"
            placeholder="Share enough context for the approver"
            value={applyForm.reason}
            onChange={setApply('reason')}
            required
          />
          {applyError && (
            <p role="alert" className="rounded-lg bg-[#fef3f2] px-3 py-2 text-[12px] leading-5 text-[#b42318]">
              {applyError}
            </p>
          )}
          <button type="submit" className="hidden" aria-hidden="true" />
        </form>
      </Modal>

      {/* Approve / reject */}
      <Modal
        open={Boolean(review)}
        onClose={() => setReview(null)}
        title={review?.mode === 'approve' ? 'Approve leave' : 'Reject leave'}
        description={
          review?.mode === 'approve'
            ? 'The attendance register will be updated for the approved range.'
            : 'The member keeps the request on file with your reason.'
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setReview(null)}>
              Cancel
            </Button>
            <Button
              variant={review?.mode === 'approve' ? 'primary' : 'danger'}
              onClick={confirmReview}
            >
              {review?.mode === 'approve' ? 'Approve request' : 'Reject request'}
            </Button>
          </>
        }
      >
        {review && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-surface-muted px-3.5 py-3">
              <p className="text-[12.5px] font-medium text-text-primary">{review.leave.employee}</p>
              <p className="mt-0.5 text-[11.5px] text-text-secondary">
                {review.leave.department} · {review.leave.type} leave · {review.leave.days} day
                {review.leave.days === 1 ? '' : 's'}
              </p>
              <p className="mt-0.5 text-[11.5px] text-text-tertiary">{rangeLabel(review.leave)}</p>
              <p className="mt-2 text-[11.5px] leading-5 text-text-secondary">{review.leave.reason || 'No reason recorded.'}</p>
            </div>
            <Textarea
              label={review.mode === 'approve' ? 'Note (optional)' : 'Reason for rejection'}
              placeholder={
                review.mode === 'approve' ? 'Cover arrangements, conditions, anything to note' : 'Explain the decision'
              }
              value={reviewNote}
              onChange={(event) => setReviewNote(event.target.value)}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}
