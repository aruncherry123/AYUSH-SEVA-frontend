import { FlaskConical } from 'lucide-react'
import { ResourceManager, DetailList } from '../components/common/ResourceManager'
import { StatusBadge } from '../utils/status'
import { formatDate } from '../utils/format'
import { useResource } from '../hooks/useResource'
import { useAuth } from '../state/AuthContext'
import type { LabTest } from '../types'

const sampleTypes = ['Blood', 'Urine', 'Stool', 'Swab', 'Tissue', 'Serum']
const statuses = ['Requested', 'Sample Collected', 'Processing', 'Completed', 'Report Approved']

export default function LabTests() {
  const { items, create, update, remove } = useResource('labTests')
  const { can } = useAuth()
  const canEdit = can('clinical.edit')

  return (
    <ResourceManager<LabTest>
      layout="standard"
      canCreate={canEdit}
      canEdit={canEdit}
      canDelete={canEdit}
      icon={FlaskConical}
      eyebrow="Diagnostics"
      title="Lab Tests"
      description="Laboratory test requests, sample workflow and result approvals."
      addLabel="New lab test"
      itemNoun="Lab test"
      items={items}
      pageSize={8}
      searchKeys={['patientName', 'testName', 'requestedBy']}
      filters={[
        { name: 'status', label: 'Status', options: statuses },
        { name: 'sampleType', label: 'Sample type', options: sampleTypes },
      ]}
      columns={[
        { key: 'patientName', header: 'Patient', sortable: true, render: (t) => <span className="font-medium text-text-primary">{t.patientName}</span> },
        { key: 'testName', header: 'Test', sortable: true },
        { key: 'sampleType', header: 'Sample', hideOnMobile: true, render: (t) => <span className="inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-4 bg-bg-secondary">{t.sampleType}</span> },
        { key: 'requestedBy', header: 'Requested by', sortable: true, hideOnMobile: true },
        { key: 'requestedAt', header: 'Requested', sortable: true, render: (t) => formatDate(t.requestedAt) },
        { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
      ]}
      fields={[
        { name: 'patientName', label: 'Patient name', required: true, placeholder: 'John Carter' },
        { name: 'testName', label: 'Test name', required: true, placeholder: 'Complete Blood Count' },
        { name: 'sampleType', label: 'Sample type', type: 'select', options: sampleTypes },
        { name: 'requestedBy', label: 'Requested by', required: true, placeholder: 'Dr. Jane Doe' },
        { name: 'requestedAt', label: 'Requested on', type: 'date', required: true },
        { name: 'status', label: 'Status', type: 'select', options: statuses },
        { name: 'result', label: 'Result', type: 'textarea', full: true, placeholder: 'Test findings / values' },
      ]}
      onCreate={create}
      onUpdate={update}
      onDelete={remove}
      renderDetail={(t) => (
        <div className="space-y-4">
          <div>
            <p className="font-display text-[16px] font-semibold tracking-[-0.01em] text-text-primary">{t.testName}</p>
            <p className="text-[12.5px] text-text-secondary">{t.patientName}</p>
            <div className="mt-1.5"><StatusBadge status={t.status} /></div>
          </div>
          <DetailList
            items={[
              { label: 'Sample type', value: t.sampleType },
              { label: 'Requested by', value: t.requestedBy },
              { label: 'Requested on', value: formatDate(t.requestedAt) },
              { label: 'Result', value: t.result || 'Pending' },
            ]}
          />
        </div>
      )}
    />
  )
}
