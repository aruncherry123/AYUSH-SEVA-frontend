import { Star, Truck } from 'lucide-react'
import { ResourceManager, DetailList } from '../components/common/ResourceManager'
import { StatusBadge } from '../utils/status'
import { useResource } from '../hooks/useResource'
import { useAuth } from '../state/AuthContext'
import type { Supplier } from '../types'

const categories = ['Pharmaceuticals', 'Medical Supplies', 'Equipment', 'Lab Reagents', 'Consumables', 'Surgical Instruments']

export default function Suppliers({ embedded = false }: { embedded?: boolean }) {
  const { items, create, update, remove } = useResource('suppliers')
  const { can } = useAuth()
  const canManage = can('inventory.manage')

  return (
    <ResourceManager<Supplier>
      embedded={embedded}
      layout="console"
      canCreate={canManage}
      canEdit={canManage}
      canDelete={canManage}
      icon={Truck}
      eyebrow="Inventory · vendors"
      title="Suppliers"
      description="Vendor directory with contact details, category and rating."
      addLabel="Add supplier"
      itemNoun="Supplier"
      items={items}
      searchKeys={['name', 'contactPerson', 'category']}
      filters={[
        { name: 'category', label: 'Category', options: categories },
        { name: 'status', label: 'Status', options: ['Active', 'Inactive'] },
      ]}
      columns={[
        { key: 'name', header: 'Supplier', sortable: true, render: (s) => <span className="font-medium text-text-primary">{s.name}</span> },
        { key: 'contactPerson', header: 'Contact', sortable: true, hideOnMobile: true },
        { key: 'category', header: 'Category', sortable: true, hideOnMobile: true },
        { key: 'phone', header: 'Phone', hideOnMobile: true },
        { key: 'rating', header: 'Rating', sortable: true, render: (s) => <span className="inline-flex items-center gap-1"><Star size={13} className="text-warning fill-warning" /> {s.rating}</span> },
        { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
      ]}
      fields={[
        { name: 'name', label: 'Supplier name', required: true, placeholder: 'MedSupply Co.' },
        { name: 'contactPerson', label: 'Contact person', required: true, placeholder: 'Robert Lee' },
        { name: 'category', label: 'Category', type: 'select', options: categories, required: true },
        { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '+1-555-0000' },
        { name: 'email', label: 'Email', type: 'email', placeholder: 'sales@supplier.com' },
        { name: 'rating', label: 'Rating (1-5)', type: 'number', defaultValue: '4' },
        { name: 'address', label: 'Address', full: true, placeholder: '120 Industrial Ave, Springfield' },
        { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
      ]}
      onCreate={(v) => create({ ...v, rating: Number(v.rating), address: v.address || '—' })}
      onUpdate={(id, v) => update(id, { ...v, rating: Number(v.rating) })}
      onDelete={remove}
      renderDetail={(s) => (
        <div className="space-y-4">
          <div>
            <p className="font-display text-[16px] font-semibold tracking-[-0.01em] text-text-primary">{s.name}</p>
            <p className="text-[12.5px] text-text-secondary">{s.category}</p>
            <div className="mt-1.5"><StatusBadge status={s.status} /></div>
          </div>
          <DetailList
            items={[
              { label: 'Contact person', value: s.contactPerson },
              { label: 'Phone', value: s.phone },
              { label: 'Email', value: s.email || '—' },
              { label: 'Address', value: s.address },
              { label: 'Rating', value: `${s.rating} / 5` },
            ]}
          />
        </div>
      )}
    />
  )
}
