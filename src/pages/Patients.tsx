import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Plus, X, ChevronRight } from 'lucide-react'
import { PageHeader } from '../components/common/PageHeader'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { Button } from '../components/ui/button'
import { DataTable, type Column } from '../components/ui/data-table'
import { EmptyState } from '../components/ui/states'
import { Avatar } from '../components/ui/avatar'
import { Tabs } from '../components/ui/tabs'
import { StatusBadge } from '../utils/status'
import { useResource } from '../hooks/useResource'
import { useToast } from '../state/ToastContext'
import { useAuth } from '../state/AuthContext'
import { PatientFormModal, bloodGroupOptions, patientStatusOptions, genderOptions } from '../components/patients/PatientFormModal'
import type { Patient } from '../types'

const statusTabs = [
  { id: 'all', label: 'All patients' },
  { id: 'Admitted', label: 'Admitted' },
  { id: 'In Consultation', label: 'In consultation' },
  { id: 'Waiting', label: 'Waiting' },
  { id: 'Discharged', label: 'Discharged' },
]

export default function Patients() {
  const { items, create } = useResource('patients')
  const { can } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const canCreate = can('patients.create')

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [gender, setGender] = useState('')
  const [formOpen, setFormOpen] = useState(false)

  const hasFilters = Boolean(query || status || bloodGroup || gender)

  const resetFilters = () => {
    setQuery('')
    setStatus('')
    setBloodGroup('')
    setGender('')
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((p) => {
      const matchesSearch =
        !q || [p.name, p.mrn, p.phone, p.doctor].some((v) => String(v ?? '').toLowerCase().includes(q))
      return (
        matchesSearch &&
        (!status || p.status === status) &&
        (!bloodGroup || p.bloodGroup === bloodGroup) &&
        (!gender || p.gender === gender)
      )
    })
  }, [items, query, status, bloodGroup, gender])

  const tabs = useMemo(
    () =>
      statusTabs.map((tab) => ({
        id: tab.id,
        label: tab.label,
        count: tab.id === 'all' ? items.length : items.filter((p) => p.status === tab.id).length,
      })),
    [items],
  )

  const registerPatient = (values: Record<string, string>) => {
    create({
      name: values.name,
      mrn: values.mrn,
      age: Number(values.age) || 0,
      gender: values.gender as Patient['gender'],
      bloodGroup: values.bloodGroup,
      phone: values.phone,
      email: values.email,
      address: values.address || '—',
      doctor: values.doctor || '—',
      status: values.status as Patient['status'],
      diagnosis: '',
    })
    toast.success('Patient registered')
    setFormOpen(false)
  }

  const columns: Column<Patient>[] = [
    {
      key: 'name',
      header: 'Patient',
      sortable: true,
      render: (p) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={p.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text-primary">{p.name}</p>
            <p className="text-[11.5px] text-text-tertiary tabular-nums">{p.mrn}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'age',
      header: 'Age',
      sortable: true,
      sortValue: (p) => p.age,
      render: (p) => <span className="text-text-secondary">{p.age}y</span>,
    },
    { key: 'gender', header: 'Gender', render: (p) => <span className="text-text-secondary">{p.gender}</span> },
    {
      key: 'bloodGroup',
      header: 'Blood',
      render: (p) => <span className="font-medium text-text-primary">{p.bloodGroup}</span>,
    },
    {
      key: 'doctor',
      header: 'Attending doctor',
      sortable: true,
      render: (p) => <span className="text-text-secondary">{p.doctor || '—'}</span>,
    },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
    {
      key: 'open',
      header: '',
      align: 'right',
      render: () => <ChevronRight size={15} className="ml-auto text-text-tertiary" />,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        variant="compact"
        eyebrow="Patient registry"
        title="Patients"
        description="Every patient record, medical number and current care status in one registry."
        actions={
          canCreate ? (
            <Button onClick={() => setFormOpen(true)}>
              <Plus size={15} /> Register patient
            </Button>
          ) : undefined
        }
      />

      <div>
        <Tabs tabs={tabs} active={status || 'all'} onChange={(id) => setStatus(id === 'all' ? '' : id)} variant="pills" />

        <div className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center">
          <div className="w-full lg:max-w-[300px]">
            <Input
              icon={<Search size={15} />}
              placeholder="Search name, MRN, phone or doctor…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search patients"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-[146px]">
              <Select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} aria-label="Filter by blood group">
                <option value="">All blood groups</option>
                {bloodGroupOptions.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </Select>
            </div>
            <div className="w-[132px]">
              <Select value={gender} onChange={(e) => setGender(e.target.value)} aria-label="Filter by gender">
                <option value="">All genders</option>
                {genderOptions.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </Select>
            </div>
            <div className="w-[146px]">
              <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
                <option value="">All statuses</option>
                {patientStatusOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-text-secondary">
                <X size={13} /> Clear
              </Button>
            )}
            <p className="ml-auto hidden text-[11.5px] text-text-tertiary sm:block">
              <span className="font-medium tabular-nums text-text-secondary">{filtered.length}</span> shown
            </p>
          </div>
        </div>

        {/* Mobile: compact list */}
        <Card className="divide-y divide-border overflow-hidden md:hidden">
          {filtered.length === 0 ? (
            <EmptyState
              title="No patients found"
              description="Try a different search term or clear the filters."
              action={<Button variant="outline" onClick={resetFilters}>Clear filters</Button>}
            />
          ) : (
            filtered.map((p) => (
              <Link
                key={p.id}
                to={`/patients/${p.id}`}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-bg-secondary"
              >
                <Avatar name={p.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-text-primary">{p.name}</p>
                  <p className="truncate text-[11.5px] text-text-secondary">
                    {p.mrn} · {p.age}y · {p.gender}
                  </p>
                </div>
                <StatusBadge status={p.status} dot={false} />
                <ChevronRight size={15} className="shrink-0 text-text-tertiary" />
              </Link>
            ))
          )}
        </Card>

        {/* Desktop: data table */}
        <Card className="hidden overflow-hidden md:block">
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(row) => row.id}
            pageSize={10}
            onRowClick={(row) => navigate(`/patients/${row.id}`)}
            emptyTitle="No patients found"
            emptyDescription="Try a different search term or clear the filters."
          />
        </Card>
      </div>

      {canCreate && (
        <PatientFormModal open={formOpen} onClose={() => setFormOpen(false)} onSubmit={registerPatient} />
      )}
    </div>
  )
}
