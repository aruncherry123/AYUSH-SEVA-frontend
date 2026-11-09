import { Package } from 'lucide-react'
import { ResourceManager, DetailList } from '../components/common/ResourceManager'
import { StatusBadge } from '../utils/status'
import { formatDate } from '../utils/format'
import { useResource } from '../hooks/useResource'
import { useAuth } from '../state/AuthContext'
import type { Equipment as EquipmentType } from '../types'

const categories = ['Imaging', 'Monitoring', 'Surgical', 'Life Support', 'Diagnostic', 'Laboratory', 'Mobility']
const statuses = ['Available', 'In Use', 'Under Maintenance', 'Damaged', 'Retired']
const locations = ['ICU', 'Operation Theatre 1', 'Operation Theatre 2', 'Radiology', 'Emergency', 'Ward A', 'Ward B', 'Laboratory']

export default function Equipment({ embedded = false }: { embedded?: boolean }) {
  const { items, create, update, remove } = useResource('equipment')
  const { can } = useAuth()
  const canManage = can('inventory.manage')

  return (
    <ResourceManager<EquipmentType>
      embedded={embedded}
      layout="console"
      canCreate={canManage}
      canEdit={canManage}
      canDelete={canManage}
      icon={Package}
      eyebrow="Inventory · equipment"
      title="Equipment"
      description="Medical equipment inventory, locations and operational status."
      addLabel="Add equipment"
      itemNoun="Equipment"
      items={items}
      searchKeys={['name', 'serialNo', 'category', 'location']}
      filters={[
        { name: 'category', label: 'Category', options: categories },
        { name: 'location', label: 'Location', options: locations },
        { name: 'status', label: 'Status', options: statuses },
      ]}
      columns={[
        { key: 'name', header: 'Equipment', sortable: true, render: (e) => <span className="font-medium text-text-primary">{e.name}</span> },
        { key: 'category', header: 'Category', sortable: true, hideOnMobile: true },
        { key: 'serialNo', header: 'Serial no.', hideOnMobile: true },
        { key: 'location', header: 'Location', sortable: true, hideOnMobile: true },
        { key: 'lastService', header: 'Last service', hideOnMobile: true, render: (e) => formatDate(e.lastService) },
        { key: 'status', header: 'Status', render: (e) => <StatusBadge status={e.status} /> },
      ]}
      fields={[
        { name: 'name', label: 'Equipment name', required: true, placeholder: 'Ventilator' },
        { name: 'category', label: 'Category', type: 'select', options: categories, required: true },
        { name: 'serialNo', label: 'Serial number', required: true, placeholder: 'SN-000123' },
        { name: 'location', label: 'Location', type: 'select', options: locations, required: true },
        { name: 'purchaseDate', label: 'Purchase date', type: 'date' },
        { name: 'lastService', label: 'Last service', type: 'date' },
        { name: 'status', label: 'Status', type: 'select', options: statuses },
      ]}
      onCreate={create}
      onUpdate={update}
      onDelete={remove}
      renderDetail={(e) => (
        <div className="space-y-4">
          <div>
            <p className="font-display text-[16px] font-semibold tracking-[-0.01em] text-text-primary">{e.name}</p>
            <p className="text-[12.5px] text-text-secondary">{e.category} · {e.serialNo}</p>
            <div className="mt-1.5"><StatusBadge status={e.status} /></div>
          </div>
          <DetailList
            items={[
              { label: 'Location', value: e.location },
              { label: 'Purchase date', value: formatDate(e.purchaseDate) },
              { label: 'Last service', value: formatDate(e.lastService) },
            ]}
          />
        </div>
      )}
    />
  )
}
