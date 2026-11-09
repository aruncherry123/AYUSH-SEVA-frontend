import { useMemo } from 'react'
import { TrendingUp, Award, ClipboardCheck, Star } from 'lucide-react'
import { PageHeader } from '../components/common/PageHeader'
import { MetricStrip } from '../components/common/MetricStrip'
import { Card, CardHeader, CardTitle } from '../components/ui/card'
import { Avatar } from '../components/ui/avatar'
import { Progress } from '../components/ui/progress'
import { useStore } from '../state/StoreContext'

export default function Performance({ embedded = false }: { embedded?: boolean }) {
  const { db } = useStore()

  const staff = useMemo(() => {
    return db.employees
      .map((e) => {
        const assigned = db.tasks.filter((t) => t.assignedTo === e.name)
        const done = assigned.filter((t) => t.status === 'Completed').length
        const records = db.attendance.filter((a) => a.employee === e.name)
        const present = records.filter((a) => a.status === 'Present' || a.status === 'Overtime').length
        const attendanceRate = records.length ? Math.round((present / records.length) * 100) : 92
        const completion = assigned.length ? Math.round((done / assigned.length) * 100) : 88
        const score = Math.round(attendanceRate * 0.4 + completion * 0.6)
        return { employee: e, done, total: assigned.length, attendanceRate, completion, score }
      })
      .sort((a, b) => b.score - a.score)
  }, [db])

  const avgScore = Math.round(staff.reduce((s, r) => s + r.score, 0) / Math.max(1, staff.length))
  const topDoctors = [...db.doctors].sort((a, b) => b.rating - a.rating).slice(0, 5)

  return (
    <div className="space-y-6">
      {!embedded && (
        <PageHeader
          variant="compact"
          eyebrow="Workforce · performance"
          title="Performance"
          description="Staff scores based on attendance, task throughput and clinical ratings."
        />
      )}

      <MetricStrip
        columns={4}
        items={[
          { label: 'Average score', value: `${avgScore}%`, note: 'across the team', icon: TrendingUp, tone: 'text-[#027a48]' },
          {
            label: 'Top performer',
            value: staff[0]?.employee.name.split(' ')[0] ?? '—',
            note: staff[0]?.employee.designation ?? 'no data',
            icon: Award,
          },
          {
            label: 'Tasks completed',
            value: staff.reduce((s, r) => s + r.done, 0),
            note: 'this cycle',
            icon: ClipboardCheck,
          },
          { label: 'Doctors rated', value: db.doctors.length, note: 'patient feedback', icon: Star },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <CardHeader action={<span className="text-[11.5px] text-text-tertiary">Score = 40% attendance · 60% tasks</span>}>
            <CardTitle>Staff scorecard</CardTitle>
          </CardHeader>

          <div className="hidden grid-cols-[1fr_88px_88px_140px] gap-4 border-b border-border px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-text-tertiary sm:grid">
            <span>Employee</span>
            <span className="text-right">Attendance</span>
            <span className="text-right">Tasks</span>
            <span className="pl-1">Score</span>
          </div>

          <ul className="divide-y divide-border">
            {staff.map((r, index) => (
              <li
                key={r.employee.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3 sm:grid-cols-[1fr_88px_88px_140px]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`w-5 shrink-0 text-center text-[11.5px] font-semibold tabular-nums ${
                      index < 3 ? 'text-primary' : 'text-text-tertiary'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <Avatar name={r.employee.name} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-text-primary">{r.employee.name}</p>
                    <p className="truncate text-[11.5px] text-text-tertiary">{r.employee.designation}</p>
                  </div>
                </div>

                <span className="hidden text-right text-[12.5px] tabular-nums text-text-secondary sm:block">
                  {r.attendanceRate}%
                </span>
                <span className="hidden text-right text-[12.5px] tabular-nums text-text-secondary sm:block">
                  {r.done}/{r.total || 0}
                </span>

                <div className="flex w-[140px] items-center justify-end gap-2 sm:w-auto">
                  <Progress
                    value={r.score}
                    tone={r.score > 85 ? 'success' : r.score > 70 ? 'primary' : 'warning'}
                    className="hidden h-1.5 w-16 sm:block"
                  />
                  <span className="w-9 text-right text-[12.5px] font-semibold tabular-nums text-text-primary">{r.score}%</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader action={<span className="text-[11.5px] text-text-tertiary">out of 5.0</span>}>
            <CardTitle>Top rated doctors</CardTitle>
          </CardHeader>
          <ul className="divide-y divide-border">
            {topDoctors.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={d.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-text-primary">{d.name}</p>
                  <p className="truncate text-[11.5px] text-text-tertiary">{d.specialization}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-medium tabular-nums text-text-primary">
                  <Star size={12} className="fill-[#dc6803] text-[#dc6803]" /> {d.rating}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
