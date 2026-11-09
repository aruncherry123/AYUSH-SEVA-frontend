import { MapPin, Phone, Users, BedDouble, UserCog } from 'lucide-react'
import { DirectoryPage } from '../components/common/DirectoryPage'
import { DetailList } from '../components/common/ResourceManager'
import { StatusBadge } from '../utils/status'
import { useResource } from '../hooks/useResource'
import { useAuth } from '../state/AuthContext'
import type { Department } from '../types'

export default function Departments({ embedded = false }: { embedded?: boolean }) {
  const { items, create, update, remove } = useResource('departments')
  const { can } = useAuth()
  const canManage = can('workforce.manage')

  return (
    <DirectoryPage<Department>
      embedded={embedded}
      canCreate={canManage}
      canEdit={canManage}
      canDelete={canManage}
      title="Departments"
      description="Organizational units, their heads, capacity and staffing."
      addLabel="Add department"
      itemNoun="Department"
      items={items}
      searchKeys={['name', 'head', 'location']}
      sortOptions={[
        { key: 'name', label: 'Name' },
        { key: 'staffCount', label: 'Staff count' },
        { key: 'beds', label: 'Beds' },
      ]}
      filters={[{ name: 'status', label: 'Status', options: ['Active', 'Inactive'] }]}
      columns={[
        { key: 'name', header: 'Department', sortable: true, render: (d) => <span className="font-medium text-text-primary">{d.name}</span> },
        { key: 'head', header: 'Head', sortable: true, hideOnMobile: true },
        { key: 'location', header: 'Location', sortable: true, hideOnMobile: true },
        { key: 'staffCount', header: 'Staff', sortable: true, render: (d) => d.staffCount },
        { key: 'beds', header: 'Beds', sortable: true, render: (d) => d.beds },
        { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
      ]}
      fields={[
        { name: 'name', label: 'Department name', required: true, placeholder: 'Cardiology' },
        { name: 'head', label: 'Department head', required: true, placeholder: 'Dr. Jane Doe' },
        { name: 'location', label: 'Location', required: true, placeholder: 'Block A, Floor 3' },
        { name: 'phone', label: 'Extension / phone', type: 'tel', placeholder: '+1-555-0000' },
        { name: 'staffCount', label: 'Staff count', type: 'number', defaultValue: '0' },
        { name: 'beds', label: 'Bed capacity', type: 'number', defaultValue: '0' },
        { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
      ]}
      onCreate={(v) => create({ ...v, staffCount: Number(v.staffCount), beds: Number(v.beds) })}
      onUpdate={(id, v) => update(id, { ...v, staffCount: Number(v.staffCount), beds: Number(v.beds) })}
      onDelete={remove}
      renderCard={(d) => (
        <div className="group rounded-xl border border-border bg-white p-4 transition-colors hover:border-border-strong">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary">
              <UserCog size={18} />
            </div>
            <StatusBadge status={d.status} dot={false} />
          </div>
          <p className="mt-3 font-display text-[13.5px] font-semibold text-text-primary">{d.name}</p>
          <p className="text-[12px] text-text-secondary">{d.head}</p>
          <div className="mt-4 grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11.5px] text-text-secondary">
            <span className="flex items-center gap-1.5"><Users size={13} className="text-text-tertiary" /> {d.staffCount} staff</span>
            <span className="flex items-center gap-1.5"><BedDouble size={13} className="text-text-tertiary" /> {d.beds} beds</span>
            <span className="col-span-2 flex items-center gap-1.5 truncate"><MapPin size={13} className="shrink-0 text-text-tertiary" /> {d.location}</span>
            <span className="col-span-2 flex items-center gap-1.5 truncate"><Phone size={13} className="shrink-0 text-text-tertiary" /> {d.phone}</span>
          </div>
        </div>
      )}
      renderDetail={(d) => (
        <div className="space-y-6">
          <div className="w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center">
            <UserCog size={24} />
          </div>
          <DetailList
            items={[
              { label: 'Department', value: d.name },
              { label: 'Head', value: d.head },
              { label: 'Location', value: d.location },
              { label: 'Phone', value: d.phone },
              { label: 'Staff count', value: d.staffCount },
              { label: 'Beds', value: d.beds },
              { label: 'Status', value: d.status, status: true },
            ]}
          />
        </div>
      )}
    />
  )
}
