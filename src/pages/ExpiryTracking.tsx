import { useMemo, useState } from 'react'
import { CalendarClock, AlertOctagon, CalendarX2, Download } from 'lucide-react'
import { PageHeader } from '../components/common/PageHeader'
import { MetricStrip } from '../components/common/MetricStrip'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Tabs } from '../components/ui/tabs'
import { StatusBadge } from '../utils/status'
import { EmptyState } from '../components/ui/states'
import { formatDate, daysUntil } from '../utils/format'
import { useToast } from '../state/ToastContext'
import { useStore } from '../state/StoreContext'

export default function ExpiryTracking({ embedded = false }: { embedded?: boolean }) {
  const toast = useToast()
  const { db } = useStore()
  const [tab, setTab] = useState<'expiring' | 'expired'>('expiring')

  const expired = useMemo(
    () =>
      db.medicines
        .filter((m) => daysUntil(m.expiryDate) < 0)
        .sort((a, b) => daysUntil(a.expiryDate) - daysUntil(b.expiryDate)),
    [db.medicines],
  )

  const expiringSoon = useMemo(
    () =>
      db.medicines
        .filter((m) => {
          const d = daysUntil(m.expiryDate)
          return d >= 0 && d <= 90
        })
        .sort((a, b) => daysUntil(a.expiryDate) - daysUntil(b.expiryDate)),
    [db.medicines],
  )

  const within30 = expiringSoon.filter((m) => daysUntil(m.expiryDate) <= 30).length
  const rows = tab === 'expiring' ? expiringSoon : expired

  return (
    <div className="space-y-6">
      {!embedded && (
        <PageHeader
          variant="compact"
          eyebrow="Inventory · shelf life"
          title="Expiry Tracking"
          description="Medicines that are expired or approaching their expiry date."
          actions={
            <Button variant="outline" onClick={() => toast.success('Export queued', 'The shelf-life review will download shortly.')}>
              <Download size={15} /> Export list
            </Button>
          }
        />
      )}

      <MetricStrip
        columns={4}
        items={[
          {
            label: 'Flagged',
            value: expired.length + expiringSoon.length,
            note: 'items needing review',
            icon: CalendarClock,
          },
          { label: 'Expired', value: expired.length, note: 'remove from shelf', icon: CalendarX2, tone: 'text-[#b42318]' },
          { label: 'Within 30 days', value: within30, note: 'plan rotation now', icon: AlertOctagon, tone: 'text-[#b54708]' },
          {
            label: 'Catalogue size',
            value: db.medicines.length,
            note: 'all medicines',
            icon: CalendarClock,
          },
        ]}
      />

      <div>
        <Tabs
          variant="pills"
          ariaLabel="Expiry groups"
          active={tab}
          onChange={(id) => setTab(id as 'expiring' | 'expired')}
          tabs={[
            { id: 'expiring', label: 'Expiring soon', count: expiringSoon.length },
            { id: 'expired', label: 'Expired', count: expired.length },
          ]}
          right={
            <span className="hidden text-[11.5px] text-text-tertiary sm:block">
              Sorted by earliest expiry
            </span>
          }
        />

        <Card className="mt-4 overflow-hidden">
          {rows.length === 0 ? (
            <EmptyState
              title={tab === 'expiring' ? 'Nothing expiring soon' : 'No expired items'}
              description={
                tab === 'expiring'
                  ? 'No medicines expire within the next 90 days.'
                  : 'All medicines are within their shelf life.'
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((m) => {
                const d = daysUntil(m.expiryDate)
                const isExpired = d < 0
                return (
                  <li key={m.id} className="flex items-center gap-4 px-5 py-3.5">
                    <span
                      className={`h-8 w-0.5 shrink-0 rounded-full ${isExpired ? 'bg-[#d92d20]' : d <= 30 ? 'bg-[#dc6803]' : 'bg-[#f79009]'}`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-text-primary">{m.name}</p>
                      <p className="truncate text-[11.5px] text-text-tertiary">
                        {m.batchNo} · {m.category} · {m.stock} {m.unit}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[12.5px] tabular-nums text-text-primary">{formatDate(m.expiryDate)}</p>
                      <p className={`text-[11px] tabular-nums ${isExpired ? 'text-[#b42318]' : d <= 30 ? 'text-[#b54708]' : 'text-text-tertiary'}`}>
                        {isExpired ? `${Math.abs(d)} days ago` : `${d} days left`}
                      </p>
                    </div>
                    <StatusBadge status={m.status} dot={false} />
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
