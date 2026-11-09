import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  CalendarDays,
  Activity,
  Pill,
  Siren,
  ListChecks,
  Stethoscope,
  ArrowRight,
  ArrowUpRight,
  AlertTriangle,
  Clock3,
  PackageX,
  FileClock,
  Wallet,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { useStore } from '../state/StoreContext'
import { useAuth } from '../state/AuthContext'
import { Avatar } from '../components/ui/avatar'
import { Progress } from '../components/ui/progress'
import { StatusBadge } from '../utils/status'
import { formatCurrency } from '../utils/format'
import { TODAY } from '../data/mockData'

const today = TODAY

const chartTooltip = {
  borderRadius: 10,
  border: '1px solid #eaecf0',
  fontSize: 12,
  boxShadow: '0 8px 24px -8px rgba(16,24,40,0.14)',
  padding: '8px 10px',
}

export default function Dashboard() {
  const { db } = useStore()
  const { user, can } = useAuth()
  const organization = db.organizations.find((org) => org.id === user?.organizationId)

  const stats = useMemo(() => {
    const organizationId = user?.organizationId
    const appointmentsToday = db.appointments.filter((a) => a.date === today)
    const activeAppointments = appointmentsToday.filter((a) => a.status !== 'Completed' && a.status !== 'Cancelled')
    const presentStaff = db.attendance.filter(
      (a) => a.date === today && a.organizationId === organizationId && (a.status === 'Present' || a.status === 'Late'),
    )
    const occupied = db.beds.filter((b) => b.status === 'Occupied').length
    const occupancy = Math.round((occupied / Math.max(1, db.beds.length)) * 100)
    const orgTasks = db.tasks.filter((t) => t.organizationId === organizationId)
    const openTasks = orgTasks.filter((t) => t.status !== 'Completed' && t.status !== 'Cancelled')
    const overdueTasks = orgTasks.filter((t) => t.status === 'Overdue')
    const stockAlerts = db.medicines.filter((m) => m.status !== 'Available')
    const activeEmergency = db.emergencyCases.filter((c) => c.status !== 'Discharged')
    const criticalEmergency = activeEmergency.filter((c) => c.severity === 'Critical' || c.severity === 'High')
    const pendingPrescriptions = db.prescriptions.filter((p) => p.status === 'Pending')
    return {
      appointmentsToday,
      activeAppointments,
      presentStaff,
      occupancy,
      occupied,
      openTasks,
      overdueTasks,
      stockAlerts,
      activeEmergency,
      criticalEmergency,
      pendingPrescriptions,
    }
  }, [db, user?.organizationId])

  const revenue = useMemo(() => {
    const organizationId = user?.organizationId
    const orgRevenue = db.revenue.filter((r) => r.organizationId === organizationId)
    const current = orgRevenue.filter((r) => r.date >= '2026-10-01' && r.date <= '2026-10-09')
    const previous = orgRevenue.filter((r) => r.date >= '2026-09-01' && r.date <= '2026-09-09')
    const total = current.reduce((sum, r) => sum + r.amount, 0)
    const previousTotal = previous.reduce((sum, r) => sum + r.amount, 0)
    const collected = current.filter((r) => r.status === 'Received').reduce((sum, r) => sum + r.amount, 0)
    const growth = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0
    const dayOf = (date: string) => Number(date.slice(8, 10))
    const series = Array.from({ length: 9 }, (_, index) => {
      const day = index + 1
      return {
        day: String(day),
        current: current.filter((r) => dayOf(r.date) === day).reduce((sum, r) => sum + r.amount, 0),
        previous: previous.filter((r) => dayOf(r.date) === day).reduce((sum, r) => sum + r.amount, 0),
      }
    })

    return { total, previousTotal, collected, outstanding: total - collected, growth, series }
  }, [db.revenue, user?.organizationId])

  const bedByWard = useMemo(() => {
    const map = new Map<string, { name: string; Available: number; Occupied: number; Other: number }>()
    db.beds.forEach((b) => {
      const entry = map.get(b.ward) ?? { name: b.ward, Available: 0, Occupied: 0, Other: 0 }
      if (b.status === 'Available') entry.Available++
      else if (b.status === 'Occupied') entry.Occupied++
      else entry.Other++
      map.set(b.ward, entry)
    })
    return Array.from(map.values())
  }, [db.beds])

  const attention = useMemo(() => {
    const items = [
      {
        key: 'emergency',
        icon: Siren,
        title: 'Critical emergency cases',
        description: 'Patients requiring immediate review',
        count: stats.criticalEmergency.length,
        path: '/facilities/emergency',
        tone: 'text-error',
        permission: 'clinical.view',
      },
      {
        key: 'stock',
        icon: PackageX,
        title: 'Medicines below threshold',
        description: 'Low, expiring or out of stock',
        count: stats.stockAlerts.length,
        path: '/inventory/stock?tab=replenishment',
        tone: 'text-[#b54708]',
        permission: 'inventory.view',
      },
      {
        key: 'tasks',
        icon: ListChecks,
        title: 'Overdue tasks',
        description: 'Past their due date',
        count: stats.overdueTasks.length,
        path: '/workforce/tasks',
        tone: 'text-[#b54708]',
        permission: 'workforce.view',
      },
      {
        key: 'prescriptions',
        icon: FileClock,
        title: 'Prescriptions awaiting dispense',
        description: 'In the pharmacy queue',
        count: stats.pendingPrescriptions.length,
        path: '/pharmacy/queue',
        tone: 'text-[#175cd3]',
        permission: 'pharmacy.view',
      },
    ]
    return items.filter((i) => i.count > 0 && can(i.permission))
  }, [can, stats])

  const todaySchedule = useMemo(
    () =>
      [...stats.appointmentsToday].sort((a, b) => {
        const toMin = (t: string) => {
          const [clock, meridiem] = t.split(' ')
          const [h, m] = clock.split(':').map(Number)
          const hour = meridiem === 'PM' && h !== 12 ? h + 12 : meridiem === 'AM' && h === 12 ? 0 : h
          return hour * 60 + m
        }
        return toMin(a.time) - toMin(b.time)
      }),
    [stats.appointmentsToday],
  )

  const kpis = [
    {
      label: 'Patients today',
      value: stats.appointmentsToday.length,
      note: `${stats.activeAppointments.length} still active`,
      icon: Users,
      path: '/appointments',
      permission: 'appointments.view',
    },
    {
      label: 'Staff on duty',
      value: stats.presentStaff.length,
      note: `of ${db.employees.length} employees`,
      icon: Stethoscope,
      path: '/workforce/attendance',
      permission: 'workforce.view',
    },
    {
      label: 'Revenue this month',
      value: formatCurrency(revenue.total),
      note: `${revenue.growth >= 0 ? '+' : ''}${revenue.growth.toFixed(1)}% vs 1–9 Sep`,
      icon: Wallet,
      path: '/management/reports',
      permission: 'reports.view',
    },
    {
      label: 'Needs attention',
      value: attention.reduce((sum, item) => sum + item.count, 0),
      note: 'across clinical & stock',
      icon: AlertTriangle,
      path: attention[0]?.path ?? '/dashboard',
      permission: 'dashboard.view',
    },
  ].filter((kpi) => can(kpi.permission))

  const firstName = user?.name.split(' ')[0] ?? 'there'
  const canViewRevenue = can('reports.view')
  const canViewSchedule = can('appointments.view')
  const canViewWards = can('clinical.view')

  return (
    <div className="page-stack">
      {/* Greeting */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label-micro">Friday, 09 October 2026</p>
          <h1 className="mt-2 font-display text-[26px] font-semibold leading-8 tracking-[-0.025em] text-text-primary">
            Good morning, {firstName}
          </h1>
          <p className="mt-1 max-w-xl text-[13px] leading-5 text-text-secondary">
            Here is what needs your attention at {organization?.name ?? 'your organisation'} today.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canViewRevenue && (
            <Link
              to="/management/reports"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border-strong bg-white px-3.5 text-[13px] font-medium text-text-primary transition-colors hover:bg-bg-secondary"
            >
              <Activity size={15} className="text-text-tertiary" />
              Reports
            </Link>
          )}
          {can('appointments.create') && (
            <Link
              to="/appointments"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
            >
              <CalendarDays size={15} />
              New appointment
            </Link>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Link
              key={kpi.label}
              to={kpi.path}
              className="group bg-white px-5 py-4 transition-colors hover:bg-surface-muted"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12px] font-medium text-text-secondary">{kpi.label}</p>
                <Icon size={14} className="text-text-tertiary transition-colors group-hover:text-primary" />
              </div>
              <p className="mt-2 font-display text-[26px] font-semibold leading-8 tracking-[-0.03em] text-text-primary tabular-nums">
                {kpi.value}
              </p>
              <p className="mt-0.5 truncate text-[11.5px] text-text-tertiary">{kpi.note}</p>
            </Link>
          )
        })}
      </div>

      {/* Trend + attention */}
      <div className={`grid grid-cols-1 gap-6 ${canViewRevenue ? 'xl:grid-cols-3' : ''}`}>
        {canViewRevenue && (
          <section className="xl:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-display text-[16px] font-semibold tracking-[-0.01em] text-text-primary">
                Revenue trend
              </h2>
              <p className="mt-0.5 text-[12.5px] text-text-secondary">
                Gross revenue, 1–9 October vs the same days in September
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-text-secondary">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" />
                October <span className="font-medium tabular-nums text-text-primary">{formatCurrency(revenue.total)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#a9c2f5]" />
                September <span className="font-medium tabular-nums text-text-primary">{formatCurrency(revenue.previousTotal)}</span>
              </span>
            </div>
          </div>
          <div className="mt-5">
            <ResponsiveContainer width="100%" height={268}>
              <AreaChart data={revenue.series} margin={{ top: 5, right: 6, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="revCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="revPrevious" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A9C2F5" stopOpacity={0.16} />
                    <stop offset="95%" stopColor="#A9C2F5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="#eef0f3" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11.5, fill: '#98a2b3' }}
                  axisLine={false}
                  tickLine={false}
                  dy={6}
                  tickFormatter={(value) => `${value}`}
                />
                <YAxis
                  tick={{ fontSize: 11.5, fill: '#98a2b3' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `$${Math.round(Number(value) / 1000)}k`}
                />
                <Tooltip
                  contentStyle={chartTooltip}
                  cursor={{ stroke: '#d0d5dd', strokeDasharray: '3 3' }}
                  labelFormatter={(label) => `Day ${label}`}
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Area type="monotone" dataKey="current" stroke="#2563EB" strokeWidth={2} fill="url(#revCurrent)" name="October" />
                <Area type="monotone" dataKey="previous" stroke="#A9C2F5" strokeWidth={2} fill="url(#revPrevious)" name="September" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-border pt-3 text-[11.5px] text-text-secondary">
            <span>
              Collected{' '}
              <span className="font-medium tabular-nums text-text-primary">{formatCurrency(revenue.collected)}</span>
            </span>
            <span>
              Outstanding{' '}
              <span className="font-medium tabular-nums text-text-primary">{formatCurrency(revenue.outstanding)}</span>
            </span>
          </div>
          </section>
        )}

        <section className="max-w-full">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-[16px] font-semibold tracking-[-0.01em] text-text-primary">Needs attention</h2>
            <span className="rounded-md bg-bg-secondary px-1.5 py-0.5 text-[10.5px] font-medium text-text-secondary">
              {attention.reduce((sum, item) => sum + item.count, 0)} items
            </span>
          </div>
          <ul className="mt-2">
            {attention.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.key}>
                  <Link
                    to={item.path}
                    className="group flex items-center gap-3 border-b border-border py-3.5 last:border-0"
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-secondary ${item.tone}`}>
                      <Icon size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-text-primary">{item.title}</p>
                      <p className="truncate text-[11.5px] text-text-tertiary">{item.description}</p>
                    </div>
                    <span className="font-display text-[17px] font-semibold tabular-nums text-text-primary">{item.count}</span>
                    <ArrowUpRight
                      size={14}
                      className="shrink-0 text-text-tertiary transition-transform group-hover:-translate-y-0.5 group-hover:text-primary"
                    />
                  </Link>
                </li>
              )
            })}
            {attention.length === 0 && (
              <li className="py-8 text-center text-[13px] text-text-secondary">Everything is clear. Nice work.</li>
            )}
          </ul>
        </section>
      </div>

      {/* Schedule + wards */}
      {(canViewSchedule || canViewWards) && (
      <div className={`grid grid-cols-1 gap-6 ${canViewSchedule && canViewWards ? 'xl:grid-cols-3' : ''}`}>
        {canViewSchedule && (
        <section className="xl:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-[16px] font-semibold tracking-[-0.01em] text-text-primary">Today&apos;s schedule</h2>
              <p className="mt-0.5 text-[12.5px] text-text-secondary">
                {todaySchedule.length} appointments · {stats.activeAppointments.length} active
              </p>
            </div>
            <Link
              to="/appointments"
              className="inline-flex items-center gap-1 text-[12.5px] font-medium text-primary transition-colors hover:text-primary-hover"
            >
              Open calendar <ArrowRight size={13} />
            </Link>
          </div>

          <ul className="mt-2">
            {todaySchedule.slice(0, 6).map((a) => (
              <li key={a.id} className="flex items-center gap-3 border-b border-border py-3 last:border-0">
                <div className="w-[68px] shrink-0">
                  <p className="text-[12px] font-medium tabular-nums text-text-primary">{a.time}</p>
                  <p className="text-[10.5px] text-text-tertiary">{a.type}</p>
                </div>
                <Avatar name={a.patientName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-text-primary">{a.patientName}</p>
                  <p className="truncate text-[11.5px] text-text-secondary">
                    {a.doctorName} · {a.department}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </li>
            ))}
            {todaySchedule.length === 0 && (
              <li className="py-8 text-center text-[13px] text-text-secondary">No appointments booked for today.</li>
            )}
          </ul>
        </section>
        )}

        {canViewWards && (
        <section>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-[16px] font-semibold tracking-[-0.01em] text-text-primary">Ward occupancy</h2>
              <p className="mt-0.5 text-[12.5px] text-text-secondary">{stats.occupancy}% of beds in use</p>
            </div>
            <Link
              to="/facilities/beds"
              className="text-[12.5px] font-medium text-primary transition-colors hover:text-primary-hover"
            >
              View
            </Link>
          </div>
          <div className="mt-5 space-y-3.5">
            {bedByWard.map((w) => {
              const total = w.Available + w.Occupied + w.Other
              const pct = Math.round((w.Occupied / Math.max(1, total)) * 100)
              return (
                <div key={w.name}>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="truncate text-[12.5px] font-medium text-text-primary">{w.name}</span>
                    <span className="shrink-0 text-[11px] tabular-nums text-text-tertiary">
                      {w.Occupied}/{total}
                    </span>
                  </div>
                  <Progress value={pct} tone={pct > 80 ? 'error' : pct > 50 ? 'warning' : 'success'} />
                </div>
              )
            })}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <div className="flex items-center gap-2 text-[12px] text-text-secondary">
              <Clock3 size={14} className="text-text-tertiary" />
              Avg. consultation
            </div>
            <span className="font-display text-[17px] font-semibold tabular-nums text-text-primary">18 min</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] text-text-secondary">
              <Pill size={14} className="text-text-tertiary" />
              Prescriptions pending
            </div>
            <span className="font-display text-[17px] font-semibold tabular-nums text-text-primary">
              {stats.pendingPrescriptions.length}
            </span>
          </div>
        </section>
        )}
      </div>
      )}
    </div>
  )
}
