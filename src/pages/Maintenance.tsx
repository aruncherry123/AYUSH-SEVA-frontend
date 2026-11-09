import { Wrench } from 'lucide-react'
import { ResourceManager, DetailList } from '../components/common/ResourceManager'
import { StatusBadge } from '../utils/status'
import { formatCurrency, formatDate } from '../utils/format'
import { useResource } from '../hooks/useResource'
import { useAuth } from '../state/AuthContext'
import type { MaintenanceRecord } from '../types'

const types = ['Preventive', 'Corrective', 'Inspection']
const statuses = ['Scheduled', 'In Progress', 'Completed', 'Overdue']

export default function Maintenance({ embedded = false }: { embedded?: boolean }) {
  const { items, create, update, remove } = useResource('maintenance')
  const { can } = useAuth()
  const canManage = can('inventory.manage')

  return (
    <ResourceManager<MaintenanceRecord>
      embedded={embedded}
      layout="console"
      canCreate={canManage}
      canEdit={canManage}
      canDelete={canManage}
      icon={Wrench}
      eyebrow="Inventory · maintenance"
      title="Maintenance"
      description="Equipment maintenance schedule, technicians and service costs."
      addLabel="Schedule maintenance"
      itemNoun="Maintenance record"
      items={items}
      searchKeys={['equipment', 'technician']}
      filters={[
        { name: 'type', label: 'Type', options: types },
        { name: 'status', label: 'Status', options: statuses },
      ]}
      columns={[
        { key: 'equipment', header: 'Equipment', sortable: true, render: (m) => <span className="font-medium text-text-primary">{m.equipment}</span> },
        { key: 'type', header: 'Type', render: (m) => <span className="inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-4 bg-bg-secondary">{m.type}</span> },
        { key: 'technician', header: 'Technician', sortable: true, hideOnMobile: true },
        { key: 'scheduledDate', header: 'Scheduled', sortable: true, render: (m) => formatDate(m.scheduledDate) },
        { key: 'cost', header: 'Cost', sortable: true, hideOnMobile: true, render: (m) => formatCurrency(m.cost) },
        { key: 'status', header: 'Status', render: (m) => <StatusBadge status={m.status} /> },
      ]}
      fields={[
        { name: 'equipment', label: 'Equipment', required: true, placeholder: 'Ventilator' },
        { name: 'type', label: 'Maintenance type', type: 'select', options: types },
        { name: 'technician', label: 'Technician', required: true, placeholder: 'Technician name' },
        { name: 'scheduledDate', label: 'Scheduled date', type: 'date', required: true },
        { name: 'cost', label: 'Cost', type: 'number', defaultValue: '0' },
        { name: 'status', label: 'Status', type: 'select', options: statuses },
      ]}
      onCreate={(v) => create({ ...v, cost: Number(v.cost) })}
      onUpdate={(id, v) => update(id, { ...v, cost: Number(v.cost) })}
      onDelete={remove}
      renderDetail={(m) => (
        <div className="space-y-4">
          <div>
            <p className="font-display text-[16px] font-semibold tracking-[-0.01em] text-text-primary">{m.equipment}</p>
            <p className="text-[12.5px] text-text-secondary">{m.type} maintenance</p>
            <div className="mt-1.5"><StatusBadge status={m.status} /></div>
          </div>
          <DetailList
            items={[
              { label: 'Technician', value: m.technician },
              { label: 'Scheduled', value: formatDate(m.scheduledDate) },
              { label: 'Cost', value: formatCurrency(m.cost) },
            ]}
          />
        </div>
      )}
    />
  )
}
