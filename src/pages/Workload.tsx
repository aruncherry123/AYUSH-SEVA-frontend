import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Users, AlertTriangle, ListChecks, ArrowRight } from 'lucide-react'
import { PageHeader } from '../components/common/PageHeader'
import { MetricStrip } from '../components/common/MetricStrip'
import { Card, CardHeader, CardTitle } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { Avatar } from '../components/ui/avatar'
import { useStore } from '../state/StoreContext'

const loadTone = (load: number) =>
  load > 70
    ? { label: 'Overloaded', className: 'bg-[#fef3f2] text-[#b42318]' }
    : load > 40
      ? { label: 'Balanced', className: 'bg-[#fffaeb] text-[#b54708]' }
      : { label: 'Optimal', className: 'bg-[#ecfdf3] text-[#027a48]' }

export default function Workload({ embedded = false }: { embedded?: boolean }) {
  const { db } = useStore()

  const rows = useMemo(() => {
    return db.employees
      .map((e) => {
        const assigned = db.tasks.filter((t) => t.assignedTo === e.name)
        const open = assigned.filter((t) => t.status !== 'Completed' && t.status !== 'Cancelled')
        const overdue = assigned.filter((t) => t.status === 'Overdue')
        const done = assigned.filter((t) => t.status === 'Completed')
        const capacity = 8
        const load = Math.min(100, Math.round((open.length / capacity) * 100))
        return { employee: e, open: open.length, overdue: overdue.length, done: done.length, total: assigned.length, load }
      })
      .sort((a, b) => b.open - a.open)
  }, [db])

  const totalOpen = rows.reduce((s, r) => s + r.open, 0)
  const overloaded = rows.filter((r) => r.load > 70).length
  const totalOverdue = rows.reduce((s, r) => s + r.overdue, 0)

  return (
    <div className="space-y-6">
      {!embedded && (
        <PageHeader
          variant="compact"
          eyebrow="Workforce · capacity"
          title="Workload"
          description="Live distribution of open tasks and capacity across the team."
          actions={
            <Link
              to="/workforce/tasks"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border-strong bg-white px-3.5 text-[13px] font-medium text-text-primary transition-colors hover:bg-bg-secondary"
            >
              Task board <ArrowRight size={14} className="text-text-tertiary" />
            </Link>
          }
        />
      )}

      <MetricStrip
        columns={4}
        items={[
          { label: 'Open tasks', value: totalOpen, note: 'across the team', icon: ListChecks },
          { label: 'Staff tracked', value: rows.length, note: 'with assigned work', icon: Users },
          { label: 'Overloaded', value: overloaded, note: 'above 70% capacity', icon: AlertTriangle, tone: 'text-[#b54708]' },
          { label: 'Overdue', value: totalOverdue, note: 'past their due date', icon: AlertTriangle, tone: 'text-[#b42318]' },
        ]}
      />

      <Card className="overflow-hidden">
        <CardHeader
          action={
            <div className="hidden items-center gap-3 text-[11px] text-text-secondary sm:flex">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#039855]" /> Optimal</span>
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#dc6803]" /> Balanced</span>
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#d92d20]" /> Overloaded</span>
            </div>
          }
        >
          <CardTitle>Capacity by person</CardTitle>
        </CardHeader>

        <ul className="divide-y divide-border">
          {rows.map((r) => {
            const tone = loadTone(r.load)
            return (
              <li key={r.employee.id} className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={r.employee.name} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-text-primary">{r.employee.name}</p>
                    <p className="truncate text-[11.5px] text-text-tertiary">
                      {r.employee.designation} · {r.employee.department}
                    </p>
                  </div>
                </div>

                <div className="hidden w-36 shrink-0 text-[11.5px] text-text-secondary lg:block">
                  {r.open} open · {r.done} done
                  {r.overdue > 0 && <span className="ml-1 font-medium text-[#b42318]">· {r.overdue} late</span>}
                </div>

                <div className="flex min-w-0 flex-1 items-center gap-3 sm:max-w-[280px]">
                  <Progress value={r.load} tone={r.load > 70 ? 'error' : r.load > 40 ? 'warning' : 'success'} className="h-1.5" />
                  <span className="w-9 shrink-0 text-right text-[12px] font-medium tabular-nums text-text-primary">{r.load}%</span>
                </div>

                <span className={`inline-flex w-fit shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${tone.className}`}>
                  {tone.label}
                </span>
              </li>
            )
          })}
        </ul>

        <div className="border-t border-border px-5 py-3">
          <p className="text-[11.5px] text-text-tertiary">
            Capacity assumes 8 concurrent open tasks per person. Overdue work is counted within open tasks.
          </p>
        </div>
      </Card>
    </div>
  )
}
