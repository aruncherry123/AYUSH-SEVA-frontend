import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Phone, Mail, MapPin, Stethoscope, BedDouble, CalendarDays, Fingerprint } from 'lucide-react'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Avatar } from '../components/ui/avatar'
import { DataTable } from '../components/ui/data-table'
import { Tabs } from '../components/ui/tabs'
import { EmptyState } from '../components/ui/states'
import { StatusBadge } from '../utils/status'
import { PatientFormModal } from '../components/patients/PatientFormModal'
import { ConfirmDialog } from '../components/ui/confirm-dialog'
import { useStore } from '../state/StoreContext'
import { useResource } from '../hooks/useResource'
import { useToast } from '../state/ToastContext'
import { useAuth } from '../state/AuthContext'
import { formatDate } from '../utils/format'
import type { Appointment, Consultation, Prescription, LabTest } from '../types'

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { db } = useStore()
  const { update, remove } = useResource('patients')
  const { can } = useAuth()
  const canEdit = can('patients.edit')
  const canDelete = can('patients.delete')

  const patient = db.patients.find((p) => p.id === id)

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [tab, setTab] = useState('appointments')

  if (!patient) {
    return (
      <Card>
        <EmptyState
          title="Patient not found"
          description="This patient may have been deleted or the link is incorrect."
          action={<Button variant="outline" onClick={() => navigate('/patients')}>Back to patients</Button>}
        />
      </Card>
    )
  }

  /* Clinical records related to this patient (matched by name, as in the
     rest of the app where records store patientName). */
  const appointments = db.appointments.filter((a) => a.patientName === patient.name)
  const consultations = db.consultations.filter((c) => c.patientName === patient.name)
  const prescriptions = db.prescriptions.filter((p) => p.patientName === patient.name)
  const labTests = db.labTests.filter((t) => t.patientName === patient.name)

  const tabs = [
    { id: 'appointments', label: 'Appointments', count: appointments.length },
    { id: 'consultations', label: 'Consultations', count: consultations.length },
    { id: 'prescriptions', label: 'Prescriptions', count: prescriptions.length },
    { id: 'labs', label: 'Lab tests', count: labTests.length },
  ].filter((t) => t.count > 0)

  const activeTab = tabs.some((t) => t.id === tab) ? tab : (tabs[0]?.id ?? '')

  const savePatient = (values: Record<string, string>) => {
    setSaving(true)
    update(patient.id, {
      name: values.name,
      mrn: values.mrn,
      age: Number(values.age) || patient.age,
      gender: values.gender as typeof patient.gender,
      bloodGroup: values.bloodGroup,
      phone: values.phone,
      email: values.email,
      address: values.address || '—',
      doctor: values.doctor || '—',
      status: values.status as typeof patient.status,
    })
    window.setTimeout(() => {
      setSaving(false)
      setEditing(false)
      toast.success('Patient updated')
    }, 150)
  }

  const deletePatient = () => {
    remove(patient.id)
    toast.success('Patient deleted')
    navigate('/patients')
  }

  return (
    <div className="space-y-6">
      <Link
        to="/patients"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft size={14} /> All patients
      </Link>

      {/* Identity header */}
      <div className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <Avatar name={patient.name} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-[24px] font-semibold leading-7 tracking-[-0.025em] text-text-primary">
                {patient.name}
              </h1>
              <StatusBadge status={patient.status} />
            </div>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-text-secondary">
              <span className="tabular-nums">{patient.mrn}</span>
              <span className="text-text-tertiary">·</span>
              <span>{patient.age} years</span>
              <span className="text-text-tertiary">·</span>
              <span>{patient.gender}</span>
              <span className="text-text-tertiary">·</span>
              <span>{patient.bloodGroup}</span>
            </p>
            {patient.diagnosis && patient.diagnosis !== '—' && (
              <p className="mt-2.5 max-w-xl text-[12.5px] leading-5 text-text-secondary">
                <span className="font-medium text-text-primary">Primary diagnosis</span> · {patient.diagnosis}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {canEdit && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil size={14} /> Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" className="text-error hover:bg-[#fef3f2]" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={14} /> Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[264px_minmax(0,1fr)] xl:grid-cols-[296px_minmax(0,1fr)]">
        {/* Identity rail */}
        <aside className="space-y-7 self-start lg:sticky lg:top-0">
          <section>
            <h2 className="label-micro mb-3">Contact</h2>
            <ul className="space-y-3">
              <Fact icon={Phone} label="Phone" value={patient.phone || '—'} />
              <Fact icon={Mail} label="Email" value={patient.email || '—'} />
              <Fact icon={MapPin} label="Address" value={patient.address || '—'} />
            </ul>
          </section>

          <section>
            <h2 className="label-micro mb-3">Care</h2>
            <ul className="space-y-3">
              <Fact
                icon={Stethoscope}
                label="Attending doctor"
                value={patient.doctor && patient.doctor !== '—' ? patient.doctor : 'Not assigned'}
              />
              <Fact icon={BedDouble} label="Ward & bed" value={patient.ward ? `${patient.ward} · ${patient.bed ?? '—'}` : 'Not admitted'} />
              <Fact
                icon={CalendarDays}
                label="Admitted on"
                value={patient.admittedAt ? formatDate(patient.admittedAt) : '—'}
              />
              <Fact icon={Fingerprint} label="Blood group" value={patient.bloodGroup} />
            </ul>
          </section>
        </aside>

        {/* Clinical history */}
        <section className="min-w-0">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-[17px] font-semibold tracking-[-0.015em] text-text-primary">
                Clinical history
              </h2>
              <p className="mt-0.5 text-[12.5px] text-text-secondary">Every encounter recorded for this patient.</p>
            </div>
            <span className="text-[11.5px] text-text-tertiary">
              {tabs.reduce((sum, t) => sum + (t.count ?? 0), 0)} records
            </span>
          </div>

          {tabs.length > 0 ? (
            <>
              <Tabs tabs={tabs} active={activeTab} onChange={setTab} />
              <div className="mt-5 overflow-hidden rounded-xl border border-border bg-white">
                {activeTab === 'appointments' && (
                  <DataTable<Appointment>
                    columns={[
                      { key: 'date', header: 'Date', sortable: true, render: (r) => formatDate(r.date) },
                      { key: 'time', header: 'Time' },
                      { key: 'doctorName', header: 'Doctor' },
                      { key: 'department', header: 'Department', hideOnMobile: true },
                      { key: 'type', header: 'Type', hideOnMobile: true },
                      { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
                    ]}
                    rows={appointments}
                    rowKey={(r) => r.id}
                    pageSize={6}
                  />
                )}
                {activeTab === 'consultations' && (
                  <DataTable<Consultation>
                    columns={[
                      { key: 'date', header: 'Date', sortable: true, render: (r) => formatDate(r.date) },
                      { key: 'doctorName', header: 'Doctor' },
                      { key: 'diagnosis', header: 'Diagnosis', render: (r) => r.diagnosis || '—' },
                      { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
                    ]}
                    rows={consultations}
                    rowKey={(r) => r.id}
                    pageSize={6}
                  />
                )}
                {activeTab === 'prescriptions' && (
                  <DataTable<Prescription>
                    columns={[
                      { key: 'date', header: 'Date', sortable: true, render: (r) => formatDate(r.date) },
                      { key: 'doctorName', header: 'Doctor', hideOnMobile: true },
                      { key: 'items', header: 'Items', render: (r) => r.items || '—' },
                      { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
                    ]}
                    rows={prescriptions}
                    rowKey={(r) => r.id}
                    pageSize={6}
                  />
                )}
                {activeTab === 'labs' && (
                  <DataTable<LabTest>
                    columns={[
                      { key: 'testName', header: 'Test' },
                      { key: 'requestedBy', header: 'Requested by', hideOnMobile: true },
                      { key: 'requestedAt', header: 'Requested', hideOnMobile: true, render: (r) => formatDate(r.requestedAt) },
                      { key: 'result', header: 'Result', hideOnMobile: true, render: (r) => r.result || '—' },
                      { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
                    ]}
                    rows={labTests}
                    rowKey={(r) => r.id}
                    pageSize={6}
                  />
                )}
              </div>
            </>
          ) : (
            <Card>
              <EmptyState
                title="No clinical records yet"
                description="Appointments, consultations, prescriptions and lab tests for this patient will appear here."
              />
            </Card>
          )}
        </section>
      </div>

      {canEdit && (
        <PatientFormModal open={editing} onClose={() => setEditing(false)} patient={patient} saving={saving} onSubmit={savePatient} />
      )}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={deletePatient}
        title="Delete this patient?"
        message={`This will permanently remove ${patient.name} (${patient.mrn}) from the registry. This action cannot be undone.`}
      />
    </div>
  )
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone
  label: string
  value: string
}) {
  return (
    <li className="flex items-start gap-2.5">
      <Icon size={14} className="mt-0.5 shrink-0 text-text-tertiary" />
      <div className="min-w-0">
        <p className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-text-tertiary">{label}</p>
        <p className="mt-0.5 break-words text-[12.5px] leading-5 text-text-primary">{value}</p>
      </div>
    </li>
  )
}
