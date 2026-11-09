import { Stethoscope } from 'lucide-react'
import { ResourceManager } from '../components/common/ResourceManager'
import { StatusBadge } from '../utils/status'
import { formatDate } from '../utils/format'
import { useResource } from '../hooks/useResource'
import { useAuth } from '../state/AuthContext'
import type { Consultation } from '../types'

const statuses = ['Scheduled', 'In Progress', 'Completed', 'Cancelled']

export default function Consultations() {
  const { items, create, update, remove } = useResource('consultations')
  const { can } = useAuth()
  const canEdit = can('clinical.edit')

  return (
    <ResourceManager<Consultation>
      layout="standard"
      canCreate={canEdit}
      canEdit={canEdit}
      canDelete={canEdit}
      icon={Stethoscope}
      eyebrow="Clinical records"
      title="Consultations"
      description="Record of clinical consultations, diagnoses and doctor notes."
      addLabel="New consultation"
      itemNoun="Consultation"
      items={items}
      searchKeys={['patientName', 'doctorName', 'diagnosis']}
      filters={[{ name: 'status', label: 'Status', options: statuses }]}
      columns={[
        { key: 'patientName', header: 'Patient', sortable: true, render: (c) => <span className="font-medium text-text-primary">{c.patientName}</span> },
        { key: 'doctorName', header: 'Doctor', sortable: true, hideOnMobile: true },
        { key: 'diagnosis', header: 'Diagnosis', hideOnMobile: true, render: (c) => <span className="text-text-secondary">{c.diagnosis}</span> },
        { key: 'date', header: 'Date', sortable: true, render: (c) => formatDate(c.date) },
        { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
      ]}
      fields={[
        { name: 'patientName', label: 'Patient name', required: true, placeholder: 'John Carter' },
        { name: 'doctorName', label: 'Doctor name', required: true, placeholder: 'Dr. Jane Doe' },
        { name: 'date', label: 'Date', type: 'date', required: true },
        { name: 'time', label: 'Time', placeholder: '10:15 AM' },
        { name: 'status', label: 'Status', type: 'select', options: statuses },
        { name: 'diagnosis', label: 'Diagnosis', full: true, required: true, placeholder: 'Primary diagnosis' },
        { name: 'notes', label: 'Clinical notes', type: 'textarea', full: true, placeholder: 'Observations, treatment plan, follow-up' },
      ]}
      onCreate={create}
      onUpdate={update}
      onDelete={remove}
      renderDetail={(c) => (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center"><Stethoscope size={18} /></div>
            <div>
              <p className="font-display text-[16px] font-semibold tracking-[-0.01em] text-text-primary">{c.patientName}</p>
              <div className="mt-1"><StatusBadge status={c.status} /></div>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-4"><span className="text-text-secondary">Doctor</span><span className="font-medium text-text-primary">{c.doctorName}</span></div>
            <div className="flex justify-between gap-4"><span className="text-text-secondary">Date</span><span className="font-medium text-text-primary">{formatDate(c.date)} · {c.time}</span></div>
            <div>
              <p className="text-text-secondary mb-1">Diagnosis</p>
              <p className="font-medium text-text-primary">{c.diagnosis}</p>
            </div>
            <div>
              <p className="text-text-secondary mb-1">Notes</p>
              <p className="text-text-primary leading-relaxed">{c.notes || '—'}</p>
            </div>
          </div>
        </div>
      )}
    />
  )
}
