import { Mail, Phone, BadgeCheck, CalendarDays } from 'lucide-react'
import { DirectoryPage } from '../components/common/DirectoryPage'
import { DetailList } from '../components/common/ResourceManager'
import { Avatar } from '../components/ui/avatar'
import { StatusBadge } from '../utils/status'
import { formatDate } from '../utils/format'
import { useResource } from '../hooks/useResource'
import { useAuth } from '../state/AuthContext'
import type { Employee } from '../types'

const designations = [
  'Registered Nurse', 'Nurse Practitioner', 'Lab Technician', 'Radiologist', 'Pharmacist',
  'Receptionist', 'Administrator', 'Ward Boy', 'Physiotherapist', 'Anesthesiologist',
]
const departments = ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Surgery', 'Dermatology', 'Emergency', 'Radiology', 'Pharmacy', 'Administration', 'ICU']

export default function Employees({ embedded = false }: { embedded?: boolean }) {
  const { items, create, update, remove } = useResource('employees')
  const { can } = useAuth()
  const canManage = can('workforce.manage')

  return (
    <DirectoryPage<Employee>
      embedded={embedded}
      canCreate={canManage}
      canEdit={canManage}
      canDelete={canManage}
      title="Employees"
      description="Manage all hospital staff, their designations, shifts and employment status."
      addLabel="Add employee"
      itemNoun="Employee"
      items={items}
      searchKeys={['name', 'designation', 'department', 'employeeCode']}
      sortOptions={[
        { key: 'name', label: 'Name' },
        { key: 'department', label: 'Department' },
        { key: 'joinDate', label: 'Join date' },
        { key: 'employeeCode', label: 'Code' },
      ]}
      filters={[
        { name: 'department', label: 'Department', options: departments },
        { name: 'shift', label: 'Shift', options: ['Morning', 'Evening', 'Night'] },
        { name: 'status', label: 'Status', options: ['Active', 'On Leave', 'Suspended', 'Inactive'] },
      ]}
      columns={[
        { key: 'name', header: 'Employee', sortable: true, render: (e) => (
          <div className="flex items-center gap-3">
            <Avatar name={e.name} size="sm" />
            <div>
              <p className="font-medium text-text-primary">{e.name}</p>
              <p className="text-[11.5px] text-text-secondary">{e.designation}</p>
            </div>
          </div>
        ) },
        { key: 'employeeCode', header: 'Code', sortable: true, hideOnMobile: true },
        { key: 'department', header: 'Department', sortable: true, hideOnMobile: true },
        { key: 'shift', header: 'Shift', render: (e) => <span className="text-sm">{e.shift}</span> },
        { key: 'status', header: 'Status', render: (e) => <StatusBadge status={e.status} /> },
      ]}
      fields={[
        { name: 'name', label: 'Full name', required: true, placeholder: 'Alex Morgan' },
        { name: 'employeeCode', label: 'Employee code', required: true, placeholder: 'EMP-1042' },
        { name: 'designation', label: 'Designation', type: 'select', options: designations, required: true },
        { name: 'department', label: 'Department', type: 'select', options: departments, required: true },
        { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '+1-555-0000' },
        { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'name@ayushseva.org' },
        { name: 'joinDate', label: 'Join date', type: 'date', required: true },
        { name: 'shift', label: 'Shift', type: 'select', options: ['Morning', 'Evening', 'Night'] },
        { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
        { name: 'status', label: 'Status', type: 'select', options: ['Active', 'On Leave', 'Suspended', 'Inactive'] },
      ]}
      onCreate={create}
      onUpdate={update}
      onDelete={remove}
      renderCard={(e) => (
        <div className="group rounded-xl border border-border bg-white p-4 transition-colors hover:border-border-strong">
          <div className="flex items-start gap-3">
            <Avatar name={e.name} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-[13.5px] font-semibold text-text-primary">{e.name}</p>
              <p className="truncate text-[12px] text-text-secondary">{e.designation}</p>
              <p className="mt-0.5 text-[11.5px] text-text-tertiary">{e.department}</p>
            </div>
            <StatusBadge status={e.status} dot={false} />
          </div>
          <div className="mt-4 space-y-1.5 text-[11.5px] text-text-secondary">
            <p className="flex items-center gap-2"><BadgeCheck size={13} className="text-text-tertiary" /> {e.employeeCode}</p>
            <p className="flex items-center gap-2"><Phone size={13} className="text-text-tertiary" /> {e.phone}</p>
            <p className="flex items-center gap-2 truncate"><Mail size={13} className="shrink-0 text-text-tertiary" /> {e.email}</p>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3.5 text-[11.5px] text-text-secondary">
            <span className="flex items-center gap-1.5"><CalendarDays size={12} className="text-text-tertiary" /> Joined {formatDate(e.joinDate)}</span>
            <span className="rounded-md bg-bg-secondary px-2 py-0.5 font-medium text-text-primary">{e.shift}</span>
          </div>
        </div>
      )}
      renderDetail={(e) => (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar name={e.name} size="lg" />
            <div>
              <p className="font-display text-[16px] font-semibold tracking-[-0.01em] text-text-primary">{e.name}</p>
              <p className="text-[12.5px] text-text-secondary">{e.designation}</p>
              <div className="mt-1.5"><StatusBadge status={e.status} /></div>
            </div>
          </div>
          <DetailList
            items={[
              { label: 'Employee code', value: e.employeeCode },
              { label: 'Department', value: e.department },
              { label: 'Shift', value: e.shift },
              { label: 'Join date', value: formatDate(e.joinDate) },
              { label: 'Phone', value: e.phone },
              { label: 'Email', value: e.email },
              { label: 'Gender', value: e.gender },
              { label: 'Status', value: e.status, status: true },
            ]}
          />
        </div>
      )}
    />
  )
}
