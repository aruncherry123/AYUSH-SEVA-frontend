import { AlertTriangle, PackageX, ShoppingCart, PackageCheck } from 'lucide-react'
import { PageHeader } from '../components/common/PageHeader'
import { MetricStrip } from '../components/common/MetricStrip'
import { Card, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import { StatusBadge } from '../utils/status'
import { EmptyState } from '../components/ui/states'
import { useToast } from '../state/ToastContext'
import { useStore } from '../state/StoreContext'
import type { Medicine } from '../types'

export default function LowStockAlerts({ embedded = false }: { embedded?: boolean }) {
  const toast = useToast()
  const { db } = useStore()

  const alerts = db.medicines
    .filter((m) => m.status === 'Low Stock' || m.status === 'Out of Stock')
    .sort((a, b) => a.stock / Math.max(1, a.minStock) - b.stock / Math.max(1, b.minStock))

  const out = alerts.filter((m) => m.status === 'Out of Stock')
  const low = alerts.filter((m) => m.status === 'Low Stock')

  const reorder = (m: Medicine) =>
    toast.success('Reorder requested', `${m.name} added to a draft purchase order.`)

  const renderRow = (m: Medicine) => {
    const pct = Math.min(100, Math.round((m.stock / Math.max(1, m.minStock)) * 100))
    return (
      <li key={m.id} className="flex flex-col gap-3 border-b border-border px-5 py-3.5 last:border-0 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[13px] font-medium text-text-primary">{m.name}</p>
            <StatusBadge status={m.status} dot={false} />
          </div>
          <p className="truncate text-[11.5px] text-text-tertiary">
            {m.category} · {m.genericName}
          </p>
          <div className="mt-2 flex items-center gap-3 sm:max-w-[320px]">
            <Progress value={pct} tone={m.status === 'Out of Stock' ? 'error' : 'warning'} className="h-1.5" />
            <span className="shrink-0 text-[11px] tabular-nums text-text-tertiary">
              {m.stock} / {m.minStock} {m.unit}
            </span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => reorder(m)}>
          <ShoppingCart size={13} /> Reorder
        </Button>
      </li>
    )
  }

  return (
    <div className="space-y-6">
      {!embedded && (
        <PageHeader
          variant="compact"
          eyebrow="Inventory · replenishment"
          title="Low Stock Alerts"
          description="Items at or below minimum stock levels requiring replenishment."
        />
      )}

      <MetricStrip
        columns={4}
        items={[
          { label: 'Total alerts', value: alerts.length, note: 'need review', icon: AlertTriangle, tone: 'text-[#b54708]' },
          { label: 'Out of stock', value: out.length, note: 'unavailable now', icon: PackageX, tone: 'text-[#b42318]' },
          { label: 'Low stock', value: low.length, note: 'below minimum', icon: AlertTriangle, tone: 'text-[#b54708]' },
          {
            label: 'Catalogue affected',
            value: `${Math.round((alerts.length / Math.max(1, db.medicines.length)) * 100)}%`,
            note: `of ${db.medicines.length} items`,
            icon: PackageCheck,
          },
        ]}
      />

      {alerts.length === 0 ? (
        <Card>
          <EmptyState
            icon={<PackageCheck size={24} />}
            title="No stock alerts"
            description="Every item is currently above its minimum stock level."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader action={<span className="text-[11.5px] font-medium tabular-nums text-text-tertiary">{out.length}</span>}>
              <CardTitle>Out of stock</CardTitle>
            </CardHeader>
            {out.length === 0 ? (
              <EmptyState title="Nothing out of stock" description="All items are available." />
            ) : (
              <ul>{out.map(renderRow)}</ul>
            )}
          </Card>

          <Card className="overflow-hidden">
            <CardHeader action={<span className="text-[11.5px] font-medium tabular-nums text-text-tertiary">{low.length}</span>}>
              <CardTitle>Low stock</CardTitle>
            </CardHeader>
            {low.length === 0 ? (
              <EmptyState title="No low stock items" description="Every item is above its minimum level." />
            ) : (
              <ul>{low.map(renderRow)}</ul>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
