import { useMemo, useState } from 'react'
import { Download, TrendingUp, DollarSign, Users, CalendarCheck, BarChart3, Wallet, Stethoscope, ArrowUpRight } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { PageHeader } from '../components/common/PageHeader'
import { MetricStrip } from '../components/common/MetricStrip'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Tabs } from '../components/ui/tabs'
import { useToast } from '../state/ToastContext'
import { useStore } from '../state/StoreContext'
import { formatCurrency } from '../utils/format'

const revenueTrend = [
  { month: 'May', revenue: 42800, expenses: 31200 },
  { month: 'Jun', revenue: 46200, expenses: 33100 },
  { month: 'Jul', revenue: 51900, expenses: 35800 },
  { month: 'Aug', revenue: 48700, expenses: 34400 },
  { month: 'Sep', revenue: 56400, expenses: 37200 },
  { month: 'Oct', revenue: 39800, expenses: 28600 },
]

const COLORS = ['#2563EB', '#5B8DEF', '#93B4F5', '#C4D7FA', '#98A2B3', '#667085']

type TabId = 'overview' | 'financial' | 'clinical'

const tooltipStyle = {
  borderRadius: 10,
  border: '1px solid #eaecf0',
  fontSize: 12,
  boxShadow: '0 8px 24px -8px rgba(16,24,40,0.14)',
  padding: '8px 10px',
}

const axisTick = { fontSize: 11.5, fill: '#98a2b3' }

export default function ReportsAnalytics() {
  const toast = useToast()
  const { db } = useStore()
  const [tab, setTab] = useState<TabId>('overview')

  const byDepartment = useMemo(() => {
    const map = new Map<string, number>()
    db.appointments.forEach((a) => map.set(a.department, (map.get(a.department) ?? 0) + 1))
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [db.appointments])

  const appointmentTrend = useMemo(() => {
    const map = new Map<string, number>()
    db.appointments.forEach((a) => map.set(a.date, (map.get(a.date) ?? 0) + 1))
    return Array.from(map.entries())
      .sort((a, b) => (a[0] > b[0] ? 1 : -1))
      .slice(-7)
      .map(([date, count]) => ({ date: date.slice(5), count }))
  }, [db.appointments])

  const totalRevenue = revenueTrend.reduce((s, m) => s + m.revenue, 0)
  const totalExpenses = revenueTrend.reduce((s, m) => s + m.expenses, 0)
  const netSurplus = totalRevenue - totalExpenses
  const margin = Math.round((netSurplus / totalRevenue) * 100)
  const activePatients = db.patients.filter((p) => p.status !== 'Discharged' && p.status !== 'Inactive').length
  const avgPerDay = Math.round(db.appointments.length / Math.max(1, new Set(db.appointments.map((a) => a.date)).size))

  const exportReport = () => toast.success('Export started', 'Your report will be ready shortly.')

  return (
    <div className="space-y-6">
      <PageHeader
        variant="compact"
        eyebrow="Insights"
        title="Reports & Analytics"
        description="Operational, clinical and financial performance across the hospital."
        actions={
          <Button variant="outline" onClick={exportReport}>
            <Download size={15} /> Export report
          </Button>
        }
      />

      <Tabs
        variant="segmented"
        ariaLabel="Report sections"
        active={tab}
        onChange={(id) => setTab(id as TabId)}
        tabs={[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'financial', label: 'Financial', icon: Wallet },
          { id: 'clinical', label: 'Clinical', icon: Stethoscope },
        ]}
        right={<span className="hidden text-[11.5px] text-text-tertiary sm:block">Updated 09 Oct 2026 · 08:45</span>}
      />

      {tab === 'overview' && (
        <div className="space-y-6">
          <MetricStrip
            columns={4}
            items={[
              { label: 'Total revenue', value: formatCurrency(totalRevenue), note: 'May – Oct 2026', icon: DollarSign },
              { label: 'Operating margin', value: `${margin}%`, note: 'net surplus / revenue', icon: TrendingUp, tone: 'text-[#027a48]' },
              { label: 'Appointments', value: db.appointments.length, note: 'all time', icon: CalendarCheck },
              { label: 'Active patients', value: activePatients, note: 'currently in care', icon: Users },
            ]}
          />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader action={<span className="text-[11.5px] text-text-tertiary">Last 6 months</span>}>
                <CardTitle>Revenue vs expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={276}>
                  <BarChart data={revenueTrend} margin={{ left: -10, right: 6 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="#eef0f3" vertical={false} />
                    <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} dy={6} />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value) || 0)}
                      contentStyle={tooltipStyle}
                      cursor={{ fill: '#f7f8fa' }}
                    />
                    <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={18} name="Revenue" />
                    <Bar dataKey="expenses" fill="#C4D7FA" radius={[4, 4, 0, 0]} barSize={18} name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 flex items-center gap-5 text-[11.5px] text-text-secondary">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Revenue</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#C4D7FA]" /> Expenses</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader action={<span className="text-[11.5px] text-text-tertiary">{byDepartment.length} units</span>}>
                <CardTitle>Appointments by department</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={196}>
                  <PieChart>
                    <Pie data={byDepartment} dataKey="value" nameKey="name" innerRadius={54} outerRadius={82} paddingAngle={2} strokeWidth={0}>
                      {byDepartment.map((entry, i) => (
                        <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="mt-3 space-y-2">
                  {byDepartment.map((d, i) => (
                    <li key={d.name} className="flex items-center gap-2 text-[12px]">
                      <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="flex-1 truncate text-text-secondary">{d.name}</span>
                      <span className="font-medium tabular-nums text-text-primary">{d.value}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === 'financial' && (
        <div className="space-y-6">
          <MetricStrip
            columns={4}
            items={[
              { label: 'Revenue collected', value: formatCurrency(totalRevenue), note: 'May – Oct', icon: DollarSign },
              { label: 'Total expenses', value: formatCurrency(totalExpenses), note: 'May – Oct', icon: Wallet },
              { label: 'Net surplus', value: formatCurrency(netSurplus), note: '+6.1% vs prior period', icon: TrendingUp, tone: 'text-[#027a48]' },
              { label: 'Operating margin', value: `${margin}%`, note: 'target 30%', icon: ArrowUpRight },
            ]}
          />

          <Card>
            <CardHeader action={<span className="text-[11.5px] text-text-tertiary">Monthly ledger</span>}>
              <CardTitle>Revenue, expenses &amp; surplus</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueTrend} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#eef0f3" vertical={false} />
                  <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} dy={6} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value) || 0)} contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} dot={{ r: 3, fill: '#2563EB' }} name="Revenue" />
                  <Line type="monotone" dataKey="expenses" stroke="#98A2B3" strokeWidth={2} dot={{ r: 3, fill: '#98A2B3' }} name="Expenses" />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-3 flex items-center gap-5 text-[11.5px] text-text-secondary">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Revenue</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#98A2B3]" /> Expenses</span>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Monthly breakdown</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[620px] text-[12.5px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.07em] text-text-tertiary">Month</th>
                    <th className="px-5 py-2.5 text-right text-[10.5px] font-semibold uppercase tracking-[0.07em] text-text-tertiary">Revenue</th>
                    <th className="px-5 py-2.5 text-right text-[10.5px] font-semibold uppercase tracking-[0.07em] text-text-tertiary">Expenses</th>
                    <th className="px-5 py-2.5 text-right text-[10.5px] font-semibold uppercase tracking-[0.07em] text-text-tertiary">Surplus</th>
                    <th className="px-5 py-2.5 text-right text-[10.5px] font-semibold uppercase tracking-[0.07em] text-text-tertiary">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueTrend.map((m) => {
                    const surplus = m.revenue - m.expenses
                    return (
                      <tr key={m.month} className="border-b border-border/80 last:border-0 hover:bg-surface-muted">
                        <td className="px-5 py-3 font-medium text-text-primary">{m.month} 2026</td>
                        <td className="px-5 py-3 text-right tabular-nums text-text-primary">{formatCurrency(m.revenue)}</td>
                        <td className="px-5 py-3 text-right tabular-nums text-text-secondary">{formatCurrency(m.expenses)}</td>
                        <td className="px-5 py-3 text-right font-medium tabular-nums text-[#027a48]">{formatCurrency(surplus)}</td>
                        <td className="px-5 py-3 text-right tabular-nums text-text-secondary">
                          {Math.round((surplus / m.revenue) * 100)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {tab === 'clinical' && (
        <div className="space-y-6">
          <MetricStrip
            columns={4}
            items={[
              { label: 'Appointments', value: db.appointments.length, note: 'all time', icon: CalendarCheck },
              { label: 'Avg. per day', value: avgPerDay, note: 'across active days', icon: BarChart3 },
              { label: 'Active patients', value: activePatients, note: 'in care', icon: Users },
              { label: 'Departments', value: db.departments.length, note: 'reporting', icon: Stethoscope },
            ]}
          />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader action={<span className="text-[11.5px] text-text-tertiary">Last 7 days</span>}>
                <CardTitle>Daily appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={appointmentTrend} margin={{ left: -20, right: 8 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="#eef0f3" vertical={false} />
                    <XAxis dataKey="date" tick={axisTick} axisLine={false} tickLine={false} dy={6} />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} dot={{ r: 3, fill: '#2563EB' }} name="Appointments" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department scale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {db.departments.slice(0, 6).map((d) => {
                  const max = Math.max(...db.departments.map((x) => x.staffCount), 1)
                  const pct = Math.round((d.staffCount / max) * 100)
                  return (
                    <div key={d.id}>
                      <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
                        <span className="text-text-primary">{d.name}</span>
                        <span className="text-[11px] text-text-tertiary">{d.staffCount} staff · {d.beds} beds</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-secondary">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
