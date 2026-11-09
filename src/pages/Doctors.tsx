import { Mail, Phone, Star, CalendarClock } from 'lucide-react'
import { DirectoryPage } from '../components/common/DirectoryPage'
import { DetailList } from '../components/common/ResourceManager'
import { Avatar } from '../components/ui/avatar'
import { StatusBadge } from '../utils/status'
import { useResource } from '../hooks/useResource'
import { useAuth } from '../state/AuthContext'
import type { Doctor } from '../types'

const specializations = [
  'Interventional Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Obstetrics & Gynecology',
  'General Surgery', 'Dermatology', 'Emergency Medicine',
]

export default function Doctors({ embedded = false }: { embedded?: boolean }) {
  const { items, create, update, remove } = useResource('doctors')
  const { can } = useAuth()
  const canManage = can('workforce.manage')

  return (
    <DirectoryPage<Doctor>
      embedded={embedded}
      canCreate={canManage}
      canEdit={canManage}
      canDelete={canManage}
      title="Doctors"
      description="Browse the medical staff directory, manage profiles, schedules and status."
      addLabel="Add doctor"
      itemNoun="Doctor"
      items={items}
      searchKeys={['name', 'specialization', 'department']}
      sortOptions={[
        { key: 'name', label: 'Name' },
        { key: 'experience', label: 'Experience' },
        { key: 'rating', label: 'Rating' },
        { key: 'department', label: 'Department' },
      ]}
      filters={[
        { name: 'department', label: 'Department', options: ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Surgery', 'Dermatology', 'Emergency'] },
        { name: 'status', label: 'Status', options: ['Active', 'On Leave', 'Inactive'] },
      ]}
      columns={[
        { key: 'name', header: 'Doctor', sortable: true, render: (d) => (
          <div className="flex items-center gap-3">
            <Avatar name={d.name} size="sm" />
            <div>
              <p className="font-medium text-text-primary">{d.name}</p>
              <p className="text-[11.5px] text-text-secondary">{d.specialization}</p>
            </div>
          </div>
        ) },
        { key: 'department', header: 'Department', sortable: true, hideOnMobile: true },
        { key: 'experience', header: 'Experience', sortable: true, hideOnMobile: true, render: (d) => `${d.experience} yrs` },
        { key: 'rating', header: 'Rating', sortable: true, render: (d) => (
          <span className="inline-flex items-center gap-1 text-text-primary"><Star size={13} className="text-warning fill-warning" /> {d.rating}</span>
        ) },
        { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
      ]}
      fields={[
        { name: 'name', label: 'Full name', required: true, placeholder: 'Dr. Jane Doe' },
        { name: 'specialization', label: 'Specialization', type: 'select', options: specializations, required: true },
        { name: 'department', label: 'Department', type: 'select', options: ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Surgery', 'Dermatology', 'Emergency', 'Gynecology'], required: true },
        { name: 'qualification', label: 'Qualification', placeholder: 'MD, DM' },
        { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '+1-555-0000' },
        { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'name@ayushseva.org' },
        { name: 'experience', label: 'Experience (years)', type: 'number', defaultValue: '1' },
        { name: 'availability', label: 'Availability', placeholder: 'Mon–Fri, 09:00–15:00' },
        { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
        { name: 'status', label: 'Status', type: 'select', options: ['Active', 'On Leave', 'Inactive'], status: true },
      ]}
      onCreate={(v) => create({ ...v, experience: Number(v.experience), rating: 4.5, patientsTreated: 0 })}
      onUpdate={(id, v) => update(id, { ...v, experience: Number(v.experience) })}
      onDelete={remove}
      renderCard={(d) => (
        <div className="group rounded-xl border border-border bg-white p-4 transition-colors hover:border-border-strong">
          <div className="flex items-start gap-3">
            <Avatar name={d.name} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-[13.5px] font-semibold text-text-primary">{d.name}</p>
              <p className="truncate text-[12px] text-text-secondary">{d.specialization}</p>
              <p className="mt-0.5 text-[11.5px] text-text-tertiary">{d.department}</p>
            </div>
            <StatusBadge status={d.status} dot={false} />
          </div>
          <div className="mt-4 space-y-1.5 text-[11.5px] text-text-secondary">
            <p className="flex items-center gap-2"><Phone size={13} className="text-text-tertiary" /> {d.phone}</p>
            <p className="flex items-center gap-2 truncate"><Mail size={13} className="shrink-0 text-text-tertiary" /> {d.email}</p>
            <p className="flex items-center gap-2"><CalendarClock size={13} className="text-text-tertiary" /> {d.availability}</p>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3.5 text-[11.5px]">
            <span className="truncate text-text-tertiary">{d.experience} yrs exp · {d.qualification}</span>
            <span className="inline-flex items-center gap-1 font-medium text-text-primary"><Star size={12} className="fill-warning text-warning" /> {d.rating}</span>
          </div>
        </div>
      )}
      renderDetail={(d) => (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar name={d.name} size="lg" />
            <div>
              <p className="font-display text-[16px] font-semibold tracking-[-0.01em] text-text-primary">{d.name}</p>
              <p className="text-[12.5px] text-text-secondary">{d.specialization}</p>
              <div className="mt-1.5"><StatusBadge status={d.status} /></div>
            </div>
          </div>
          <DetailList
            items={[
              { label: 'Department', value: d.department },
              { label: 'Qualification', value: d.qualification },
              { label: 'Experience', value: `${d.experience} years` },
              { label: 'Phone', value: d.phone },
              { label: 'Email', value: d.email },
              { label: 'Gender', value: d.gender },
              { label: 'Availability', value: d.availability },
              { label: 'Patients treated', value: d.patientsTreated.toLocaleString() },
              { label: 'Rating', value: `${d.rating} / 5` },
            ]}
          />
          <div>
            <p className="text-sm font-semibold text-text-primary mb-2">Weekly Schedule</p>
            <div className="flex gap-1.5">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                <div key={day} className={`flex-1 rounded-lg py-2 text-center text-xs ${i < 5 ? 'bg-primary-light text-primary' : 'bg-bg-secondary text-text-secondary'}`}>
                  {day}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    />
  )
}
