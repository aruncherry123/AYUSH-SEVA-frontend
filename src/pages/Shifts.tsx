import { Clock, UserCog, Users } from 'lucide-react'
import { DirectoryPage } from '../components/common/DirectoryPage'
import { DetailList } from '../components/common/ResourceManager'
import { StatusBadge } from '../utils/status'
import { useResource } from '../hooks/useResource'
import { useAuth } from '../state/AuthContext'
import type { Shift } from '../types'

const departments = ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Surgery', 'Emergency', 'ICU', 'Radiology', 'Pharmacy']

export default function Shifts() {
  const { items, create, update, remove } = useResource('shifts')
  const { can } = useAuth()
  const canManage = can('workforce.manage')

  return (
    <DirectoryPage<Shift>
      canCreate={canManage}
      canEdit={canManage}
      canDelete={canManage}
      title="Shifts"
      description="Shift patterns, timings and staffing per department."
      addLabel="Add shift"
      itemNoun="Shift"
      items={items}
      searchKeys={['name', 'department', 'supervisor']}
      sortOptions={[
        { key: 'name', label: 'Name' },
        { key: 'department', label: 'Department' },
        { key: 'staffCount', label: 'Staff count' },
      ]}
      filters={[
        { name: 'department', label: 'Department', options: departments },
        { name: 'status', label: 'Status', options: ['Active', 'Inactive'] },
      ]}
      columns={[
        { key: 'name', header: 'Shift', sortable: true, render: (s) => <span className="font-medium text-text-primary">{s.name}</span> },
        { key: 'department', header: 'Department', sortable: true },
        { key: 'startTime', header: 'Start', render: (s) => s.startTime },
        { key: 'endTime', header: 'End', render: (s) => s.endTime },
        { key: 'supervisor', header: 'Supervisor', sortable: true, hideOnMobile: true },
        { key: 'staffCount', header: 'Staff', sortable: true, render: (s) => s.staffCount },
        { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
      ]}
      fields={[
        { name: 'name', label: 'Shift name', required: true, placeholder: 'Morning Shift' },
        { name: 'department', label: 'Department', type: 'select', options: departments, required: true },
        { name: 'startTime', label: 'Start time', required: true, placeholder: '07:00 AM' },
        { name: 'endTime', label: 'End time', required: true, placeholder: '03:00 PM' },
        { name: 'supervisor', label: 'Supervisor', placeholder: 'Nurse Manager name' },
        { name: 'staffCount', label: 'Staff count', type: 'number', defaultValue: '0' },
        { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
      ]}
      onCreate={(v) => create({ ...v, staffCount: Number(v.staffCount) })}
      onUpdate={(id, v) => update(id, { ...v, staffCount: Number(v.staffCount) })}
      onDelete={remove}
      renderCard={(s) => (
        <div className="group rounded-xl border border-border bg-white p-4 transition-colors hover:border-border-strong">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary">
              <Clock size={18} />
            </div>
            <StatusBadge status={s.status} dot={false} />
          </div>
          <p className="mt-3 font-display text-[13.5px] font-semibold text-text-primary">{s.name}</p>
          <p className="text-[12px] text-text-secondary">{s.department}</p>
          <div className="mt-3 flex items-center gap-2 text-[12.5px] font-medium text-text-primary">
            <Clock size={14} className="text-text-tertiary" /> {s.startTime} – {s.endTime}
          </div>
          <div className="mt-4 space-y-1.5 border-t border-border pt-3.5 text-[11.5px] text-text-secondary">
            <p className="flex items-center gap-2"><UserCog size={13} className="text-text-tertiary" /> {s.supervisor || 'Unassigned'}</p>
            <p className="flex items-center gap-2"><Users size={13} className="text-text-tertiary" /> {s.staffCount} staff assigned</p>
          </div>
        </div>
      )}
      renderDetail={(s) => (
        <DetailList
          items={[
            { label: 'Shift', value: s.name },
            { label: 'Department', value: s.department },
            { label: 'Timing', value: `${s.startTime} – ${s.endTime}` },
            { label: 'Supervisor', value: s.supervisor || '—' },
            { label: 'Staff count', value: s.staffCount },
            { label: 'Status', value: s.status, status: true },
          ]}
        />
      )}
    />
  )
}
