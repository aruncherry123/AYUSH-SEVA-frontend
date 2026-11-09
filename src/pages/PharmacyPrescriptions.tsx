import { FileText, CheckCircle2 } from 'lucide-react'
import { ResourceManager, DetailList } from '../components/common/ResourceManager'
import { StatusBadge } from '../utils/status'
import { formatDate } from '../utils/format'
import { useResource } from '../hooks/useResource'
import { useAuth } from '../state/AuthContext'
import { useToast } from '../state/ToastContext'
import { Button } from '../components/ui/button'
import type { Prescription } from '../types'

const statuses = ['Pending', 'Dispensed', 'Cancelled']

export default function PharmacyPrescriptions({ embedded = false }: { embedded?: boolean }) {
  const toast = useToast()
  const { items, create, update, remove } = useResource('prescriptions')
  const { can } = useAuth()
  const canManage = can('pharmacy.manage')
  const canDispense = canManage || can('pharmacy.dispense')

  return (
    <ResourceManager<Prescription>
      layout="standard"
      canCreate={canManage}
      canEdit={canManage}
      canDelete={canManage}
      icon={FileText}
      eyebrow="Pharmacy queue"
      title="Pharmacy Queue"
      description="Prescriptions routed to the pharmacy for verification and dispensing."
      addLabel="New prescription"
      itemNoun="Prescription"
      items={items}
      pageSize={10}
      searchKeys={['patientName', 'doctorName', 'items']}
      filters={[{ name: 'status', label: 'Status', options: statuses }]}
      embedded={embedded}
      columns={[
        { key: 'patientName', header: 'Patient', sortable: true, render: (p) => <span className="font-medium text-text-primary">{p.patientName}</span> },
        { key: 'doctorName', header: 'Prescribed by', sortable: true, hideOnMobile: true },
        { key: 'items', header: 'Medicines', hideOnMobile: true, render: (p) => <span className="text-text-secondary block max-w-xs truncate">{p.items}</span> },
        { key: 'date', header: 'Date', sortable: true, render: (p) => formatDate(p.date) },
        { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
      ]}
      fields={[
        { name: 'patientName', label: 'Patient name', required: true, placeholder: 'John Carter' },
        { name: 'doctorName', label: 'Prescribing doctor', required: true, placeholder: 'Dr. Jane Doe' },
        { name: 'date', label: 'Date', type: 'date', required: true },
        { name: 'status', label: 'Status', type: 'select', options: statuses },
        { name: 'items', label: 'Medicines', full: true, required: true, placeholder: 'Amoxicillin 500mg — 1-0-1 × 5 days' },
        { name: 'notes', label: 'Notes', type: 'textarea', full: true },
      ]}
      onCreate={create}
      onUpdate={update}
      onDelete={remove}
      rowActions={(row) =>
        row.status === 'Pending' && canDispense ? (
          <Button
            size="sm"
            variant="subtle"
            onClick={(e) => {
              e.stopPropagation()
              update(row.id, { status: 'Dispensed' })
              toast.success('Marked as dispensed')
            }}
          >
            <CheckCircle2 size={14} /> Dispense
          </Button>
        ) : null
      }
      renderDetail={(p) => (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-[16px] font-semibold tracking-[-0.01em] text-text-primary">{p.patientName}</p>
              <p className="text-[12.5px] text-text-secondary">{formatDate(p.date)}</p>
            </div>
            <StatusBadge status={p.status} />
          </div>
          <DetailList
            items={[
              { label: 'Prescribed by', value: p.doctorName },
              { label: 'Medicines', value: p.items },
              { label: 'Notes', value: p.notes || '—' },
            ]}
          />
        </div>
      )}
    />
  )
}
