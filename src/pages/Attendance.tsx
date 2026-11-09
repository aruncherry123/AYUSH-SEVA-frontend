import { useMemo, useState } from 'react'
import { Clock, LogIn, LogOut, CalendarDays, Timer, Coffee, Users } from 'lucide-react'
import { PageHeader } from '../components/common/PageHeader'
import { MetricStrip } from '../components/common/MetricStrip'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { DataTable, type Column } from '../components/ui/data-table'
import { Tabs } from '../components/ui/tabs'
import { StatusBadge } from '../utils/status'
import { Avatar } from '../components/ui/avatar'
import { useStore } from '../state/StoreContext'
import { useAuth } from '../state/AuthContext'
import { useToast } from '../state/ToastContext'
import { TODAY } from '../data/mockData'
import { formatDate } from '../utils/format'
import type { AttendanceRecord } from '../types'

const MONTH = TODAY.slice(0, 7)

const toMinutes = (value: string) => {
  if (!value || value === '—') return null
  const [time, period] = value.split(' ')
  const [hours, minutes] = time.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  const hour = period === 'PM' && hours !== 12 ? hours + 12 : period === 'AM' && hours === 12 ? 0 : hours
  return hour * 60 + minutes
}

const clockLabel = (date: Date) =>
  date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

const hoursBetween = (from: string, to: string) => {
  const start = toMinutes(from)
  const end = toMinutes(to)
  if (start === null || end === null || end <= start) return 0
  return Math.round(((end - start) / 60) * 10) / 10
}

const countWeekdays = (from: string, to: string) => {
  let count = 0
  const start = new Date(`${from}T00:00:00Z`)
  const end = new Date(`${to}T00:00:00Z`)
  for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const day = cursor.getUTCDay()
    if (day !== 0 && day !== 6) count++
  }
  return count
}

export default function Attendance() {
  const { db, create, update } = useStore()
  const { user, can } = useAuth()
  const toast = useToast()
  const [tab, setTab] = useState<'today' | 'month'>('today')
  const canManage = can('workforce.manage')

  const organizationRecords = useMemo(
    () => db.attendance.filter((record) => record.organizationId === user?.organizationId),
    [db.attendance, user?.organizationId],
  )

  const scoped = useMemo(() => {
    if (!user) return []
    return canManage
      ? organizationRecords
      : organizationRecords.filter((record) => record.userId === user.id)
  }, [canManage, organizationRecords, user])

  const myToday = useMemo(
    () => (user ? organizationRecords.find((record) => record.userId === user.id && record.date === TODAY) : undefined),
    [organizationRecords, user],
  )

  const monthRecords = useMemo(
    () => scoped.filter((record) => record.date.startsWith(MONTH)).sort((a, b) => b.date.localeCompare(a.date)),
    [scoped],
  )

  const summary = useMemo(() => {
    const present = monthRecords.filter((record) => record.status === 'Present').length
    const late = monthRecords.filter((record) => record.status === 'Late').length
    const leave = monthRecords.filter((record) => record.status === 'On Leave').length
    const absent = monthRecords.filter((record) => record.status === 'Absent').length
    const overtime = monthRecords.filter((record) => record.status === 'Overtime').length
    const hours = monthRecords.filter((record) => (record.workedHours ?? 0) > 0)
    const average = hours.length
      ? hours.reduce((sum, record) => sum + (record.workedHours ?? 0), 0) / hours.length
      : 0
    const elapsed = canManage
      ? countWeekdays(`${MONTH}-01`, TODAY)
      : countWeekdays(`${MONTH}-01`, TODAY)
    return { present, late, leave, absent, overtime, average, elapsed }
  }, [canManage, monthRecords])

  const todayRoster = useMemo(
    () => organizationRecords.filter((record) => record.date === TODAY).sort((a, b) => a.employee.localeCompare(b.employee)),
    [organizationRecords],
  )

  const department = (record: AttendanceRecord) => record.department

  const checkIn = () => {
    if (!user) return
    const now = new Date()
    const time = clockLabel(now)
    const minutes = toMinutes(time) ?? 9 * 60
    const status = minutes > 9 * 60 + 30 ? 'Late' : 'Present'
    if (myToday) {
      update('attendance', myToday.id, {
        checkIn: time,
        checkOut: '—',
        status,
      })
    } else {
      create('attendance', {
        organizationId: user.organizationId,
        branchId: user.branchId,
        userId: user.id,
        employee: user.name,
        department: user.department,
        date: TODAY,
        checkIn: time,
        checkOut: '—',
        status,
      })
    }
    toast.success('Checked in', `You are marked ${status.toLowerCase()} at ${time}.`)
  }

  const checkOut = () => {
    if (!myToday) return
    const now = new Date()
    const time = clockLabel(now)
    const worked = hoursBetween(myToday.checkIn, time)
    update('attendance', myToday.id, {
      checkOut: time,
      workedHours: worked,
      status: myToday.status === 'Late' ? 'Late' : worked >= 9 ? 'Overtime' : 'Present',
    })
    toast.success('Checked out', `${worked.toFixed(1)} hours recorded for today.`)
  }

  const columns: Column<AttendanceRecord>[] = [
    ...(canManage
      ? [
          {
            key: 'employee',
            header: 'Member',
            sortable: true,
            render: (record: AttendanceRecord) => (
              <div className="flex min-w-0 items-center gap-2.5">
                <Avatar name={record.employee} size="sm" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-text-primary">{record.employee}</p>
                  <p className="truncate text-[11px] text-text-tertiary">{department(record)}</p>
                </div>
              </div>
            ),
          },
        ]
      : []),
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (record) => <span className="whitespace-nowrap tabular-nums text-text-secondary">{formatDate(record.date)}</span>,
    },
    {
      key: 'checkIn',
      header: 'Check in',
      render: (record) => <span className="tabular-nums text-text-secondary">{record.checkIn}</span>,
    },
    {
      key: 'checkOut',
      header: 'Check out',
      hideOnMobile: true,
      render: (record) => <span className="tabular-nums text-text-secondary">{record.checkOut}</span>,
    },
    {
      key: 'workedHours',
      header: 'Hours',
      align: 'right',
      render: (record) => (
        <span className="tabular-nums text-text-secondary">
          {record.workedHours ? `${record.workedHours.toFixed(1)} h` : record.status === 'On Leave' || record.status === 'Absent' ? '—' : 'Active'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (record) => <StatusBadge status={record.status} />,
    },
  ]

  const todayStatus = myToday?.status ?? 'Not checked in'
  const checkedOut = Boolean(myToday?.checkOut && myToday.checkOut !== '—')
  const onLeave = myToday?.status === 'On Leave'

  return (
    <div className="space-y-6">
      <PageHeader
        variant="compact"
        eyebrow="Workforce · attendance"
        title="Attendance"
        description={
          canManage
            ? 'Organisation-wide daily attendance, monthly hours and leave-adjusted records.'
            : 'Your check-in, check-out and monthly attendance record.'
        }
      />

      <MetricStrip
        columns={4}
        items={[
          { label: 'Present days', value: summary.present + summary.late, note: `of ${summary.elapsed} working days`, icon: CalendarDays, tone: 'text-[#027a48]' },
          { label: 'On leave', value: summary.leave, note: 'approved this month', icon: Coffee, tone: 'text-[#175cd3]' },
          { label: 'Late arrivals', value: summary.late, note: 'after 09:30', icon: Clock, tone: 'text-[#b54708]' },
          { label: 'Average hours', value: summary.average ? `${summary.average.toFixed(1)} h` : '—', note: 'per working day', icon: Timer },
        ]}
      />

      <Tabs
        tabs={[
          { id: 'today', label: 'Today', icon: Clock },
          { id: 'month', label: 'Monthly register', icon: CalendarDays },
        ]}
        active={tab}
        onChange={(id) => setTab(id as 'today' | 'month')}
        variant="underline"
      />

      {tab === 'today' ? (
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={user?.name ?? 'You'} size="lg" />
                <div className="min-w-0">
                  <p className="label-micro">Your attendance · Friday, 09 October</p>
                  <p className="mt-1 truncate font-display text-[17px] font-semibold tracking-[-0.01em] text-text-primary">
                    {user?.name}
                  </p>
                  <p className="mt-0.5 text-[12px] text-text-secondary">
                    {user?.designation} · {user?.department}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
                <div>
                  <p className="text-[10.5px] font-medium uppercase tracking-[0.07em] text-text-tertiary">Status</p>
                  <div className="mt-1">
                    <StatusBadge status={todayStatus} />
                  </div>
                </div>
                <div>
                  <p className="text-[10.5px] font-medium uppercase tracking-[0.07em] text-text-tertiary">Check in</p>
                  <p className="mt-1 text-[13px] font-medium tabular-nums text-text-primary">{myToday?.checkIn ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[10.5px] font-medium uppercase tracking-[0.07em] text-text-tertiary">Check out</p>
                  <p className="mt-1 text-[13px] font-medium tabular-nums text-text-primary">{myToday?.checkOut ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[10.5px] font-medium uppercase tracking-[0.07em] text-text-tertiary">Hours</p>
                  <p className="mt-1 text-[13px] font-medium tabular-nums text-text-primary">
                    {myToday?.workedHours ? `${myToday.workedHours.toFixed(1)} h` : '—'}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                {!myToday || (onLeave ? false : !myToday.checkIn || myToday.checkIn === '—') ? (
                  <Button onClick={checkIn} disabled={onLeave}>
                    <LogIn size={15} /> Check in
                  </Button>
                ) : checkedOut ? (
                  <span className="rounded-lg bg-[#ecfdf3] px-3 py-2 text-[12px] font-medium text-[#027a48]">
                    Day complete
                  </span>
                ) : (
                  <Button onClick={checkOut}>
                    <LogOut size={15} /> Check out
                  </Button>
                )}
              </div>
            </div>

            {onLeave && (
              <p className="mt-4 rounded-lg border border-primary-border bg-primary-light px-3 py-2 text-[12px] leading-5 text-primary">
                You are on approved leave today. Check-in is disabled and the day is recorded as On Leave.
              </p>
            )}
          </Card>

          {canManage ? (
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-[15px] font-semibold tracking-[-0.01em] text-text-primary">
                    Today’s roster
                  </h2>
                  <p className="mt-0.5 text-[12px] text-text-secondary">
                    {todayRoster.length} records across {new Set(todayRoster.map((record) => record.branchId)).size} branches.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-bg-secondary px-2 py-1 text-[11.5px] font-medium text-text-secondary">
                  <Users size={12} /> {todayRoster.filter((record) => record.status === 'Present' || record.status === 'Late').length} on duty
                </span>
              </div>
              <Card className="overflow-hidden">
                <DataTable
                  columns={columns}
                  rows={todayRoster}
                  rowKey={(record) => record.id}
                  pageSize={10}
                  density="compact"
                  emptyTitle="No attendance recorded today"
                  emptyDescription="Records appear here as members check in."
                />
              </Card>
            </section>
          ) : (
            <Card className="p-5">
              <p className="text-[12.5px] text-text-secondary">
                Your check-in and check-out times are recorded against Friday, 09 October 2026. Approved leave automatically appears as On Leave.
              </p>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-[15px] font-semibold tracking-[-0.01em] text-text-primary">
                {canManage ? 'Organisation register · October' : 'My register · October'}
              </h2>
              <p className="mt-0.5 text-[12px] text-text-secondary">
                {monthRecords.length} records · {summary.absent} absent · {summary.overtime} overtime
              </p>
            </div>
            <span className="text-[11.5px] text-text-tertiary">Working days elapsed: {summary.elapsed}</span>
          </div>
          <Card className="overflow-hidden">
            <DataTable
              columns={columns}
              rows={monthRecords}
              rowKey={(record) => record.id}
              pageSize={10}
              density="compact"
              emptyTitle="No attendance in this month"
              emptyDescription="Attendance records will appear here after check-in."
            />
          </Card>
        </div>
      )}
    </div>
  )
}
