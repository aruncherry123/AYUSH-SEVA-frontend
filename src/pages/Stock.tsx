import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Package,
  AlertTriangle,
  PackageX,
  DollarSign,
  ArrowRight,
  ArrowUpRight,
  Search,
  CalendarClock,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
} from 'lucide-react'
import { PageHeader } from '../components/common/PageHeader'
import { MetricStrip } from '../components/common/MetricStrip'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { Tabs } from '../components/ui/tabs'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { StatusBadge } from '../utils/status'
import { daysUntil, formatCurrency, formatDate, formatNumber } from '../utils/format'
import { useTabParam } from '../hooks/useTabParam'
import { useStore } from '../state/StoreContext'
import Medicines from './Medicines'
import LowStockAlerts from './LowStockAlerts'
import ExpiryTracking from './ExpiryTracking'

const stockStatuses = ['Available', 'Low Stock', 'Out of Stock', 'Expiring', 'Expired'] as const

const tabs = ['overview', 'catalogue', 'replenishment', 'expiry'] as const

export default function Inventory() {
  const [tab, setTab] = useTabParam(tabs, 'overview')

  return (
    <div className="space-y-6">
      <PageHeader
        variant="compact"
        eyebrow="Pharmacy & inventory"
        title="Inventory"
        description="Stock health, catalogue, replenishment and shelf life."
      />

      <Tabs
        ariaLabel="Inventory sections"
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'catalogue', label: 'Catalogue' },
          { id: 'replenishment', label: 'Replenishment' },
          { id: 'expiry', label: 'Expiry' },
        ]}
      />

      {tab === 'overview' && <InventoryOverview />}
      {tab === 'catalogue' && <Medicines embedded />}
      {tab === 'replenishment' && <LowStockAlerts embedded />}
      {tab === 'expiry' && <ExpiryTracking embedded />}
    </div>
  )
}

function InventoryOverview() {
  const { db } = useStore()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')

  const stats = useMemo(() => {
    const value = db.medicines.reduce((sum, m) => sum + m.stock * m.price, 0)
    return {
      items: db.medicines.length,
      units: db.medicines.reduce((sum, m) => sum + m.stock, 0),
      low: db.medicines.filter((m) => m.status === 'Low Stock').length,
      out: db.medicines.filter((m) => m.status === 'Out of Stock').length,
      expiring: db.medicines.filter((m) => {
        const days = daysUntil(m.expiryDate)
        return m.status === 'Expiring' || (days >= 0 && days <= 90)
      }).length,
      value,
    }
  }, [db.medicines])

  const register = useMemo(() => {
    const q = query.trim().toLowerCase()
    const priority: Record<string, number> = {
      'Out of Stock': 0,
      Expired: 1,
      'Low Stock': 2,
      Expiring: 3,
      Available: 4,
    }
    return db.medicines
      .filter((m) => {
        const matchesSearch =
          !q ||
          [m.name, m.genericName, m.category, m.manufacturer, m.batchNo].some((value) =>
            String(value).toLowerCase().includes(q),
          )
        return matchesSearch && (!status || m.status === status)
      })
      .sort((a, b) => (priority[a.status] ?? 9) - (priority[b.status] ?? 9) || a.name.localeCompare(b.name))
  }, [db.medicines, query, status])

  const reorder = useMemo(
    () =>
      [...db.medicines]
        .filter((m) => m.status !== 'Available' || m.stock <= m.minStock)
        .sort((a, b) => a.stock / Math.max(1, a.minStock) - b.stock / Math.max(1, b.minStock))
        .slice(0, 4),
    [db.medicines],
  )

  const expiring = useMemo(
    () =>
      [...db.medicines]
        .filter((m) => daysUntil(m.expiryDate) <= 90)
        .sort((a, b) => daysUntil(a.expiryDate) - daysUntil(b.expiryDate))
        .slice(0, 4),
    [db.medicines],
  )

  const byCategory = useMemo(() => {
    const map = new Map<string, { count: number; value: number; low: number }>()
    db.medicines.forEach((m) => {
      const entry = map.get(m.category) ?? { count: 0, value: 0, low: 0 }
      entry.count++
      entry.value += m.stock * m.price
      if (m.status !== 'Available') entry.low++
      map.set(m.category, entry)
    })
    return Array.from(map.entries())
      .map(([category, value]) => ({ category, ...value }))
      .sort((a, b) => b.value - a.value)
  }, [db.medicines])

  const movements = useMemo(
    () => [...db.stockMovements].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [db.stockMovements],
  )

  const maxValue = Math.max(1, ...byCategory.map((c) => c.value))

  return (
    <div className="space-y-6">
      <MetricStrip
        columns={5}
        items={[
          { label: 'Catalogue', value: stats.items, note: 'active line items', icon: Package },
          { label: 'Low stock', value: stats.low, note: 'below minimum', icon: AlertTriangle, tone: 'text-[#b54708]' },
          { label: 'Out of stock', value: stats.out, note: 'unavailable', icon: PackageX, tone: 'text-[#b42318]' },
          { label: 'Expiring', value: stats.expiring, note: 'within 90 days', icon: CalendarClock, tone: 'text-[#b54708]' },
          {
            label: 'Inventory value',
            value: formatCurrency(stats.value),
            note: 'at current cost',
            icon: DollarSign,
            tone: 'text-[#027a48]',
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <CardHeader
            action={
              <Link
                to="/inventory/stock?tab=catalogue"
                className="inline-flex items-center gap-1 text-[12px] font-medium text-primary transition-colors hover:text-primary-hover"
              >
                Open catalogue <ArrowUpRight size={13} />
              </Link>
            }
          >
            <CardTitle>Stock register</CardTitle>
            <CardDescription>
              On-hand quantities across {formatNumber(stats.units)} units.
            </CardDescription>
          </CardHeader>

          <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:px-5">
            <div className="w-full sm:max-w-[300px]">
              <Input
                icon={<Search size={15} />}
                placeholder="Search medicine, batch or supplier…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search inventory"
              />
            </div>
            <div className="w-full sm:w-[168px]">
              <Select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                aria-label="Filter by stock status"
              >
                <option value="">All statuses</option>
                {stockStatuses.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </Select>
            </div>
            <p className="whitespace-nowrap text-[11.5px] text-text-tertiary sm:ml-auto">
              <span className="font-medium tabular-nums text-text-secondary">{register.length}</span> of {stats.items} lines
            </p>
          </div>

          <ul className="divide-y divide-border">
            {register.slice(0, 7).map((m) => {
              const pct = Math.min(100, Math.round((m.stock / Math.max(1, m.minStock)) * 100))
              const tone = m.status === 'Out of Stock' || m.status === 'Expired' ? 'error' : pct < 100 ? 'warning' : 'success'
              return (
                <li
                  key={m.id}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted/60 sm:px-5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-muted text-text-tertiary">
                    <Package size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-text-primary">{m.name}</p>
                    <p className="truncate text-[11.5px] text-text-tertiary">
                      {m.genericName} · {m.batchNo}
                    </p>
                  </div>
                  <div className="hidden w-24 shrink-0 md:block">
                    <div className="mb-1 flex items-center justify-between text-[10px] text-text-tertiary">
                      <span>Level</span>
                      <span className="tabular-nums">{pct}%</span>
                    </div>
                    <Progress value={pct} tone={tone} />
                  </div>
                  <div className="w-[74px] shrink-0 text-right">
                    <p className="text-[12.5px] font-medium tabular-nums text-text-primary">{formatNumber(m.stock)}</p>
                    <p className="text-[10.5px] text-text-tertiary">min {formatNumber(m.minStock)}</p>
                  </div>
                  <div className="hidden w-[78px] shrink-0 text-right sm:block">
                    <p className="text-[12px] tabular-nums text-text-secondary">{formatCurrency(m.stock * m.price)}</p>
                    <p className="text-[10.5px] text-text-tertiary">value</p>
                  </div>
                  <StatusBadge status={m.status} dot={false} />
                </li>
              )
            })}
            {register.length === 0 && (
              <li className="px-5 py-10 text-center">
                <p className="text-[13px] font-medium text-text-primary">No stock lines match</p>
                <p className="mt-1 text-[12px] text-text-secondary">Try a different search or status filter.</p>
              </li>
            )}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 sm:px-5">
            <p className="text-[11.5px] text-text-tertiary">
              Showing {Math.min(7, register.length)} of {register.length} matching lines
            </p>
            <Link
              to="/inventory/stock?tab=catalogue"
              className="inline-flex items-center gap-1 text-[12px] font-medium text-primary transition-colors hover:text-primary-hover"
            >
              Full catalogue <ArrowRight size={13} />
            </Link>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader
              action={
                <Link
                  to="/inventory/stock?tab=replenishment"
                  className="text-[12px] font-medium text-primary transition-colors hover:text-primary-hover"
                >
                  All
                </Link>
              }
            >
              <CardTitle>Reorder now</CardTitle>
              <CardDescription>Items at or below minimum stock.</CardDescription>
            </CardHeader>
            <ul className="divide-y divide-border">
              {reorder.map((m) => {
                const shortfall = Math.max(0, m.minStock - m.stock)
                return (
                  <li key={m.id} className="flex items-start gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium text-text-primary">{m.name}</p>
                      <p className="truncate text-[10.5px] text-text-tertiary">{m.category} · {m.manufacturer}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11.5px] font-medium tabular-nums text-[#b42318]">
                        {shortfall > 0 ? `${formatNumber(shortfall)} short` : 'Out'}
                      </p>
                      <p className="text-[10.5px] text-text-tertiary">{m.unit}</p>
                    </div>
                  </li>
                )
              })}
              {reorder.length === 0 && (
                <li className="px-5 py-6 text-center text-[12px] text-text-secondary">
                  Every item is above its minimum level.
                </li>
              )}
            </ul>
            <div className="border-t border-border px-5 py-3">
              <Link
                to="/inventory/stock?tab=replenishment"
                className="inline-flex items-center gap-1 text-[12px] font-medium text-primary transition-colors hover:text-primary-hover"
              >
                View replenishment <ArrowRight size={13} />
              </Link>
            </div>
          </Card>

          <Card>
            <CardHeader
              action={
                <Link
                  to="/inventory/stock?tab=expiry"
                  className="text-[12px] font-medium text-primary transition-colors hover:text-primary-hover"
                >
                  All
                </Link>
              }
            >
              <CardTitle>Expiring soon</CardTitle>
              <CardDescription>Batches within 90 days.</CardDescription>
            </CardHeader>
            <ul className="divide-y divide-border">
              {expiring.map((m) => {
                const days = daysUntil(m.expiryDate)
                return (
                  <li key={m.id} className="flex items-start gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium text-text-primary">{m.name}</p>
                      <p className="truncate text-[10.5px] text-text-tertiary">{m.batchNo}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={`text-[11.5px] font-medium ${
                          days < 0 ? 'text-[#b42318]' : days <= 30 ? 'text-[#b54708]' : 'text-text-secondary'
                        }`}
                      >
                        {days < 0 ? 'Expired' : `${days} days`}
                      </p>
                      <p className="text-[10.5px] text-text-tertiary">{formatDate(m.expiryDate)}</p>
                    </div>
                  </li>
                )
              })}
              {expiring.length === 0 && (
                <li className="px-5 py-6 text-center text-[12px] text-text-secondary">
                  No batches expiring in the next 90 days.
                </li>
              )}
            </ul>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader action={<span className="text-[11.5px] text-text-tertiary">{byCategory.length} categories</span>}>
            <CardTitle>Value by category</CardTitle>
            <CardDescription>Holding value at current unit cost.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {byCategory.map((c) => (
              <div key={c.category}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-[12.5px]">
                  <span className="truncate text-text-primary">{c.category}</span>
                  <span className="shrink-0 text-[11.5px] text-text-tertiary">
                    {formatCurrency(c.value)} · {c.count} items
                  </span>
                </div>
                <Progress value={Math.round((c.value / maxValue) * 100)} tone={c.low > 0 ? 'warning' : 'primary'} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            action={
              <Link
                to="/inventory/procurement?tab=movements"
                className="inline-flex items-center gap-1 text-[12px] font-medium text-primary transition-colors hover:text-primary-hover"
              >
                All <ArrowUpRight size={13} />
              </Link>
            }
          >
            <CardTitle>Recent movements</CardTitle>
            <CardDescription>Latest stock in and out.</CardDescription>
          </CardHeader>
          <ul className="divide-y divide-border">
            {movements.map((m) => {
              const inbound = m.type === 'In' || m.type === 'Return'
              const signed = inbound ? Math.abs(m.quantity) : m.type === 'Out' ? -Math.abs(m.quantity) : m.quantity
              const Icon = inbound ? ArrowDownToLine : m.type === 'Out' ? ArrowUpFromLine : RotateCcw
              const tint = inbound
                ? 'bg-[#ecfdf3] text-[#027a48]'
                : m.type === 'Out'
                  ? 'bg-[#fef3f2] text-[#b42318]'
                  : 'bg-[#fffaeb] text-[#b54708]'
              return (
                <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${tint}`}>
                    <Icon size={13} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-text-primary">{m.item}</p>
                    <p className="truncate text-[10.5px] text-text-tertiary">
                      {m.reference} · {formatDate(m.date)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-[12px] font-medium tabular-nums ${
                      inbound ? 'text-[#027a48]' : m.type === 'Out' ? 'text-[#b42318]' : 'text-text-secondary'
                    }`}
                  >
                    {signed > 0 ? '+' : ''}{formatNumber(signed)}
                  </span>
                </li>
              )
            })}
            {movements.length === 0 && (
              <li className="px-5 py-6 text-center text-[12px] text-text-secondary">No stock movements recorded.</li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  )
}
