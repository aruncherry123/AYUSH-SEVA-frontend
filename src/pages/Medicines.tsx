import { Pill } from 'lucide-react'
import { ResourceManager, DetailList } from '../components/common/ResourceManager'
import { StatusBadge } from '../utils/status'
import { formatCurrency, formatDate } from '../utils/format'
import { useResource } from '../hooks/useResource'
import { useAuth } from '../state/AuthContext'
import type { Medicine } from '../types'

const categories = ['Antibiotic', 'Analgesic', 'Cardiovascular', 'Antidiabetic', 'Respiratory', 'Gastrointestinal', 'Neurological', 'Vitamin', 'Vaccine', 'Antiseptic']
const statuses = ['Available', 'Low Stock', 'Out of Stock', 'Expiring', 'Expired']

export default function Medicines({ embedded = false }: { embedded?: boolean }) {
  const { items, create, update, remove } = useResource('medicines')
  const { can } = useAuth()
  const canManage = can('inventory.manage')

  return (
    <ResourceManager<Medicine>
      embedded={embedded}
      layout="console"
      canCreate={canManage}
      canEdit={canManage}
      canDelete={canManage}
      icon={Pill}
      eyebrow="Inventory · pharmacy catalogue"
      title="Medicines"
      description="Master catalogue of medicines with stock levels, pricing and expiry."
      addLabel="Add medicine"
      itemNoun="Medicine"
      items={items}
      pageSize={8}
      searchKeys={['name', 'genericName', 'category', 'manufacturer']}
      filters={[
        { name: 'category', label: 'Category', options: categories },
        { name: 'status', label: 'Status', options: statuses },
      ]}
      columns={[
        { key: 'name', header: 'Medicine', sortable: true, render: (m) => (
          <div>
            <p className="font-medium text-text-primary">{m.name}</p>
            <p className="text-[11.5px] text-text-secondary">{m.genericName}</p>
          </div>
        ) },
        { key: 'category', header: 'Category', sortable: true, hideOnMobile: true },
        { key: 'stock', header: 'Stock', sortable: true, render: (m) => <span className={m.stock <= m.minStock ? 'text-error font-medium' : ''}>{m.stock} {m.unit}</span> },
        { key: 'price', header: 'Price', sortable: true, hideOnMobile: true, render: (m) => formatCurrency(m.price) },
        { key: 'expiryDate', header: 'Expiry', sortable: true, hideOnMobile: true, render: (m) => formatDate(m.expiryDate) },
        { key: 'status', header: 'Status', render: (m) => <StatusBadge status={m.status} /> },
      ]}
      fields={[
        { name: 'name', label: 'Brand name', required: true, placeholder: 'Amoxil 500' },
        { name: 'genericName', label: 'Generic name', required: true, placeholder: 'Amoxicillin' },
        { name: 'category', label: 'Category', type: 'select', options: categories, required: true },
        { name: 'manufacturer', label: 'Manufacturer', placeholder: 'GSK' },
        { name: 'batchNo', label: 'Batch number', placeholder: 'BATCH-001' },
        { name: 'unit', label: 'Unit', type: 'select', options: ['Tablet', 'Capsule', 'Bottle', 'Vial', 'Tube', 'Strip'] },
        { name: 'stock', label: 'Current stock', type: 'number', required: true, defaultValue: '0' },
        { name: 'minStock', label: 'Minimum stock', type: 'number', required: true, defaultValue: '10' },
        { name: 'price', label: 'Unit price', type: 'number', required: true, defaultValue: '0' },
        { name: 'expiryDate', label: 'Expiry date', type: 'date', required: true },
        { name: 'status', label: 'Status', type: 'select', options: statuses },
      ]}
      onCreate={(v) => create({ ...v, stock: Number(v.stock), minStock: Number(v.minStock), price: Number(v.price) })}
      onUpdate={(id, v) => update(id, { ...v, stock: Number(v.stock), minStock: Number(v.minStock), price: Number(v.price) })}
      onDelete={remove}
      renderDetail={(m) => (
        <div className="space-y-4">
          <div>
            <p className="font-display text-[16px] font-semibold tracking-[-0.01em] text-text-primary">{m.name}</p>
            <p className="text-[12.5px] text-text-secondary">{m.genericName}</p>
            <div className="mt-1.5"><StatusBadge status={m.status} /></div>
          </div>
          <DetailList
            items={[
              { label: 'Category', value: m.category },
              { label: 'Manufacturer', value: m.manufacturer },
              { label: 'Batch number', value: m.batchNo },
              { label: 'Stock', value: `${m.stock} ${m.unit}` },
              { label: 'Minimum stock', value: `${m.minStock} ${m.unit}` },
              { label: 'Unit price', value: formatCurrency(m.price) },
              { label: 'Expiry date', value: formatDate(m.expiryDate) },
            ]}
          />
        </div>
      )}
    />
  )
}
