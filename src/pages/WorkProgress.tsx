import { useMemo } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts'
import { ListChecks, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { PageHeader } from '../components/common/PageHeader'
import { MetricStrip } from '../components/common/MetricStrip'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { StatusBadge } from '../utils/status'
import { formatDate } from '../utils/format'
import { useStore } from '../state/StoreContext'

const statusOrder = ['Assigned', 'In Progress', 'Pending', 'Overdue', 'Completed', 'Cancelled']

const statusColor: Record<string, string> = {
  Assigned: '#93b4f5',
  'In Progress': '#dc6803',
  Pending: '#f79009',
  Overdue: '#d92d20',
  Completed: '#039855',
  Cancelled: '#98a2b3',
}

const tooltipStyle = {
  borderRadius: 10,
  border: '1px solid #eaecf0',
  fontSize: 12,
  boxShadow: '0 8px 24px -8px rgba(16,24,40,0.14)',
  padding: '8px 10px',
}

export default function WorkProgress({ embedded = false }: { embedded?: boolean }) {
  const { db } = useStore()

  const byStatus = useMemo(
    () =>
      statusOrder
        .map((s) => ({ name: s, count: db.tasks.filter((t) => t.status === s).length }))
        .filter((s) => s.count > 0),
    [db.tasks],
  )

  const total = db.tasks.length
  const completed = db.tasks.filter((t) => t.status === 'Completed').length
  const overdue = db.tasks.filter((t) => t.status === 'Overdue').length
  const completion = Math.round((completed / Math.max(1, total)) * 100)

  const byDepartment = useMemo(() => {
    const map = new Map<string, { total: number; done: number }>()
    db.tasks.forEach((t) => {
      const entry = map.get(t.department) ?? { total: 0, done: 0 }
      entry.total++
      if (t.status === 'Completed') entry.done++
      map.set(t.department, entry)
    })
    return Array.from(map.entries())
      .map(([dept, v]) => ({ dept, ...v, pct: Math.round((v.done / Math.max(1, v.total)) * 100) }))
      .sort((a, b) => b.pct - a.pct)
  }, [db.tasks])

  const upcoming = db.tasks
    .filter((t) => t.status !== 'Completed' && t.status !== 'Cancelled')
    .sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1))
    .slice(0, 6)

  return (
    <div className="space-y-6">
      {!embedded && (
        <PageHeader
          variant="compact"
          eyebrow="Workforce · throughput"
          title="Work Progress"
          description="Track task throughput, completion rate and departmental progress."
        />
      )}

      <MetricStrip
        columns={4}
        items={[
          { label: 'Total tasks', value: total, note: 'this cycle', icon: ListChecks },
          { label: 'Completed', value: completed, note: `${completion}% completion rate`, icon: CheckCircle2, tone: 'text-[#027a48]' },
          {
            label: 'In progress',
            value: db.tasks.filter((t) => t.status === 'In Progress').length,
            note: 'being worked now',
            icon: Clock,
          },
          { label: 'Overdue', value: overdue, note: 'need follow-up', icon: AlertTriangle, tone: 'text-[#b42318]' },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader action={<span className="text-[11.5px] text-text-tertiary">All open and closed tasks</span>}>
            <CardTitle>Tasks by status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={244}>
              <BarChart data={byStatus} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#eef0f3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11.5, fill: '#98a2b3' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={82}
                  tick={{ fontSize: 11.5, fill: '#667085' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f7f8fa' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16} name="Tasks">
                  {byStatus.map((entry) => (
                    <Cell key={entry.name} fill={statusColor[entry.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overall completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="font-display text-[34px] font-semibold leading-9 tracking-[-0.03em] text-text-primary tabular-nums">
                {completion}%
              </span>
              <span className="pb-1 text-[12px] text-text-secondary">
                {completed} of {total} tasks
              </span>
            </div>
            <Progress value={completion} tone={completion > 70 ? 'success' : 'primary'} className="mt-3" />
            <dl className="mt-5 divide-y divide-border border-t border-border">
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-[12px] text-text-secondary">Open tasks</dt>
                <dd className="text-[12.5px] font-medium tabular-nums text-text-primary">
                  {total - completed - db.tasks.filter((t) => t.status === 'Cancelled').length}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-[12px] text-text-secondary">Overdue</dt>
                <dd className={`text-[12.5px] font-medium tabular-nums ${overdue > 0 ? 'text-[#b42318]' : 'text-text-primary'}`}>
                  {overdue}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-[12px] text-text-secondary">Departments</dt>
                <dd className="text-[12.5px] font-medium tabular-nums text-text-primary">{byDepartment.length}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Progress by department</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {byDepartment.map((d) => (
              <div key={d.dept}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-[12.5px]">
                  <span className="truncate text-text-primary">{d.dept}</span>
                  <span className="shrink-0 text-[11px] tabular-nums text-text-tertiary">
                    {d.done}/{d.total} · {d.pct}%
                  </span>
                </div>
                <Progress value={d.pct} tone={d.pct > 70 ? 'success' : d.pct > 40 ? 'primary' : 'warning'} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader action={<span className="text-[11.5px] text-text-tertiary">Next six</span>}>
            <CardTitle>Upcoming deadlines</CardTitle>
          </CardHeader>
          {upcoming.length === 0 ? (
            <p className="px-5 py-8 text-center text-[12.5px] text-text-secondary">No open deadlines.</p>
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium text-text-primary">{t.title}</p>
                    <p className="truncate text-[11.5px] text-text-tertiary">
                      {t.assignedTo} · {t.department}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11.5px] tabular-nums text-text-secondary">{formatDate(t.dueDate)}</span>
                  <StatusBadge status={t.status} dot={false} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
