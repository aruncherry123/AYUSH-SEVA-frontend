import { ShoppingCart } from 'lucide-react'
import { ResourceManager, DetailList } from '../components/common/ResourceManager'
import { StatusBadge } from '../utils/status'
import { formatCurrency, formatDate } from '../utils/format'
import { useResource } from '../hooks/useResource'
import { useAuth } from '../state/AuthContext'
import type { PurchaseOrder } from '../types'

const statuses = ['Draft', 'Pending Approval', 'Ordered', 'Partially Received', 'Received', 'Cancelled']

export default function PurchaseOrders({ embedded = false }: { embedded?: boolean }) {
  const { items, create, update, remove } = useResource('purchaseOrders')
  const { can } = useAuth()
  const canManage = can('inventory.manage')

  return (
    <ResourceManager<PurchaseOrder>
      embedded={embedded}
      layout="console"
      canCreate={canManage}
      canEdit={canManage}
      canDelete={canManage}
      icon={ShoppingCart}
      eyebrow="Inventory · procurement"
      title="Purchase Orders"
      description="Procurement orders, approval status and expected delivery."
      addLabel="New purchase order"
      itemNoun="Purchase order"
      items={items}
      searchKeys={['supplier']}
      filters={[{ name: 'status', label: 'Status', options: statuses }]}
      columns={[
        { key: 'supplier', header: 'Supplier', sortable: true, render: (p) => <span className="font-medium text-text-primary">{p.supplier}</span> },
        { key: 'items', header: 'Items', sortable: true, align: 'center', render: (p) => p.items },
        { key: 'total', header: 'Total', sortable: true, render: (p) => formatCurrency(p.total) },
        { key: 'orderDate', header: 'Ordered', sortable: true, hideOnMobile: true, render: (p) => formatDate(p.orderDate) },
        { key: 'expectedDate', header: 'Expected', sortable: true, hideOnMobile: true, render: (p) => formatDate(p.expectedDate) },
        { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
      ]}
      fields={[
        { name: 'supplier', label: 'Supplier', required: true, placeholder: 'MedSupply Co.' },
        { name: 'items', label: 'Number of items', type: 'number', required: true, defaultValue: '1' },
        { name: 'total', label: 'Order total', type: 'number', required: true, defaultValue: '0' },
        { name: 'orderDate', label: 'Order date', type: 'date', required: true },
        { name: 'expectedDate', label: 'Expected date', type: 'date', required: true },
        { name: 'status', label: 'Status', type: 'select', options: statuses },
      ]}
      onCreate={(v) => create({ ...v, items: Number(v.items), total: Number(v.total) })}
      onUpdate={(id, v) => update(id, { ...v, items: Number(v.items), total: Number(v.total) })}
      onDelete={remove}
      renderDetail={(p) => (
        <div className="space-y-4">
          <div>
            <p className="font-display text-[16px] font-semibold tracking-[-0.01em] text-text-primary">{p.supplier}</p>
            <div className="mt-1.5"><StatusBadge status={p.status} /></div>
          </div>
          <DetailList
            items={[
              { label: 'Items', value: p.items },
              { label: 'Total', value: formatCurrency(p.total) },
              { label: 'Order date', value: formatDate(p.orderDate) },
              { label: 'Expected date', value: formatDate(p.expectedDate) },
            ]}
          />
        </div>
      )}
    />
  )
}
