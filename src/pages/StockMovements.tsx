import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, RefreshCw, Undo2 } from 'lucide-react'
import { ResourceManager, DetailList } from '../components/common/ResourceManager'
import { formatDate } from '../utils/format'
import { useResource } from '../hooks/useResource'
import { useAuth } from '../state/AuthContext'
import type { StockMovement } from '../types'

const types = ['In', 'Out', 'Adjustment', 'Return']

const typeMeta: Record<string, { icon: typeof ArrowDownLeft; tone: string }> = {
  In: { icon: ArrowDownLeft, tone: 'bg-[#ecfdf3] text-[#027a48]' },
  Out: { icon: ArrowUpRight, tone: 'bg-[#fef3f2] text-[#b42318]' },
  Adjustment: { icon: RefreshCw, tone: 'bg-[#fffaeb] text-[#b54708]' },
  Return: { icon: Undo2, tone: 'bg-[#eff4ff] text-[#175cd3]' },
}

/** Direction-aware quantity: Out is always negative, In/Return positive. */
const signedQuantity = (m: StockMovement) => {
  if (m.type === 'Out') return -Math.abs(m.quantity)
  if (m.type === 'Adjustment') return m.quantity
  return Math.abs(m.quantity)
}

const formatQuantity = (m: StockMovement) => {
  const value = signedQuantity(m)
  return `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value)}`
}

export default function StockMovements({ embedded = false }: { embedded?: boolean }) {
  const { items, create, update, remove } = useResource('stockMovements')
  const { can } = useAuth()
  const canManage = can('inventory.manage')

  return (
    <ResourceManager<StockMovement>
      embedded={embedded}
      layout="console"
      canCreate={canManage}
      canEdit={canManage}
      canDelete={canManage}
      icon={ArrowLeftRight}
      eyebrow="Inventory · stock ledger"
      title="Stock Movements"
      description="Audit trail of all stock-in, stock-out, adjustments and returns."
      addLabel="Record movement"
      itemNoun="Stock movement"
      items={items}
      pageSize={10}
      searchKeys={['item', 'reference', 'handledBy']}
      filters={[{ name: 'type', label: 'Type', options: types }]}
      columns={[
        {
          key: 'item',
          header: 'Item',
          sortable: true,
          render: (m) => {
            const meta = typeMeta[m.type] ?? typeMeta.Adjustment
            const Icon = meta.icon
            return (
              <div className="flex items-center gap-3">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${meta.tone}`}>
                  <Icon size={15} />
                </span>
                <span className="font-medium text-text-primary">{m.item}</span>
              </div>
            )
          },
        },
        {
          key: 'type',
          header: 'Type',
          render: (m) => (
            <span className="rounded bg-bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-text-secondary">
              {m.type}
            </span>
          ),
        },
        {
          key: 'quantity',
          header: 'Qty',
          sortable: true,
          align: 'right',
          sortValue: (m) => signedQuantity(m),
          render: (m) => (
            <span
              className={`font-medium tabular-nums ${
                signedQuantity(m) < 0 ? 'text-[#b42318]' : 'text-[#027a48]'
              }`}
            >
              {formatQuantity(m)}
            </span>
          ),
        },
        { key: 'reference', header: 'Reference', hideOnMobile: true },
        { key: 'date', header: 'Date', sortable: true, render: (m) => formatDate(m.date) },
        { key: 'handledBy', header: 'Handled by', hideOnMobile: true },
      ]}
      fields={[
        { name: 'item', label: 'Item', required: true, placeholder: 'Amoxil 500' },
        { name: 'type', label: 'Movement type', type: 'select', options: types },
        { name: 'quantity', label: 'Quantity', type: 'number', required: true, defaultValue: '1' },
        { name: 'date', label: 'Date', type: 'date', required: true },
        { name: 'reference', label: 'Reference', placeholder: 'PO-2041 / Invoice #' },
        { name: 'handledBy', label: 'Handled by', placeholder: 'Pharmacist name' },
      ]}
      onCreate={(v) => create({ ...v, quantity: Number(v.quantity) })}
      onUpdate={(id, v) => update(id, { ...v, quantity: Number(v.quantity) })}
      onDelete={remove}
      renderDetail={(m) => (
        <DetailList
          items={[
            { label: 'Item', value: m.item },
            { label: 'Type', value: m.type },
            { label: 'Quantity', value: formatQuantity(m) },
            { label: 'Reference', value: m.reference || '—' },
            { label: 'Date', value: formatDate(m.date) },
            { label: 'Handled by', value: m.handledBy || '—' },
          ]}
        />
      )}
    />
  )
}
