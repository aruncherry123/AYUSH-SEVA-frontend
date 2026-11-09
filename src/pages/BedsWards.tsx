import { useMemo, useState } from 'react'
import { BedDouble, CheckCircle2, Users, Wrench } from 'lucide-react'
import { PageHeader } from '../components/common/PageHeader'
import { MetricStrip } from '../components/common/MetricStrip'
import { Card } from '../components/ui/card'
import { Tabs } from '../components/ui/tabs'
import { Modal } from '../components/ui/modal'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { StatusBadge } from '../utils/status'
import { useToast } from '../state/ToastContext'
import { useResource } from '../hooks/useResource'
import type { Bed, BedStatus } from '../types'

const statusDot: Record<BedStatus, string> = {
  Available: 'bg-[#039855]',
  Occupied: 'bg-[#d92d20]',
  Reserved: 'bg-[#dc6803]',
  Maintenance: 'bg-[#98a2b3]',
}

const statuses: BedStatus[] = ['Available', 'Occupied', 'Reserved', 'Maintenance']

export default function BedsWards() {
  const toast = useToast()
  const { items, update } = useResource('beds')
  const wards = useMemo(() => Array.from(new Set(items.map((b) => b.ward))), [items])
  const [activeWard, setActiveWard] = useState(wards[0] ?? '')
  const [selected, setSelected] = useState<Bed | null>(null)
  const [status, setStatus] = useState<BedStatus>('Available')
  const [patient, setPatient] = useState('')

  const currentWard = wards.includes(activeWard) ? activeWard : wards[0]
  const beds = items.filter((b) => b.ward === currentWard)

  const counts = useMemo(
    () => ({
      total: items.length,
      available: items.filter((b) => b.status === 'Available').length,
      occupied: items.filter((b) => b.status === 'Occupied').length,
      maintenance: items.filter((b) => b.status === 'Maintenance').length,
    }),
    [items],
  )

  const openBed = (bed: Bed) => {
    setSelected(bed)
    setStatus(bed.status)
    setPatient(bed.patientName === '—' ? '' : bed.patientName)
  }

  const save = () => {
    if (!selected) return
    update(selected.id, {
      status,
      patientName: status === 'Occupied' ? patient || 'Unnamed patient' : '—',
    })
    toast.success('Bed updated', `${selected.bedNumber} is now ${status.toLowerCase()}.`)
    setSelected(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        variant="compact"
        eyebrow="Facilities"
        title="Beds & Wards"
        description="Bed-level availability and occupancy across every ward and unit."
      />

      <MetricStrip
        columns={4}
        items={[
          { label: 'Total beds', value: counts.total, note: `${wards.length} wards`, icon: BedDouble },
          {
            label: 'Available',
            value: counts.available,
            note: `${Math.round((counts.available / Math.max(1, counts.total)) * 100)}% ready`,
            icon: CheckCircle2,
            tone: 'text-[#027a48]',
          },
          {
            label: 'Occupied',
            value: counts.occupied,
            note: `${Math.round((counts.occupied / Math.max(1, counts.total)) * 100)}% occupancy`,
            icon: Users,
            tone: 'text-[#b42318]',
          },
          { label: 'Maintenance', value: counts.maintenance, note: 'out of service', icon: Wrench, tone: 'text-[#b54708]' },
        ]}
      />

      <div>
        <Tabs
          variant="pills"
          ariaLabel="Wards"
          active={currentWard}
          onChange={setActiveWard}
          tabs={wards.map((w) => ({
            id: w,
            label: w,
            count: items.filter((b) => b.ward === w && b.status === 'Occupied').length,
          }))}
          right={<span className="hidden text-[11.5px] text-text-tertiary sm:block">{beds.length} beds in this ward</span>}
        />

        <Card className="mt-4 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
            <div>
              <p className="text-[13px] font-semibold text-text-primary">{currentWard}</p>
              <p className="text-[11.5px] text-text-tertiary">
                {beds.filter((b) => b.status === 'Occupied').length} of {beds.length} beds occupied
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {statuses.map((s) => (
                <span key={s} className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                  <span className={`h-1.5 w-1.5 rounded-full ${statusDot[s]}`} />
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 p-5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {beds.map((bed) => (
              <button
                key={bed.id}
                onClick={() => openBed(bed)}
                className="group rounded-lg border border-border bg-white p-3 text-left transition-colors hover:border-primary-border hover:bg-primary-light/30"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-text-primary">{bed.bedNumber}</span>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusDot[bed.status]}`} aria-label={bed.status} />
                </div>
                <p className="mt-0.5 text-[11px] text-text-tertiary">{bed.type}</p>
                <div className="mt-2.5">
                  <StatusBadge status={bed.status} dot={false} />
                </div>
                <p className={`mt-1.5 truncate text-[11px] ${bed.patientName !== '—' ? 'text-text-secondary' : 'text-text-tertiary'}`}>
                  {bed.patientName !== '—' ? bed.patientName : 'Unassigned'}
                </p>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Bed ${selected.bedNumber}` : ''}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={save}>Update bed</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3 text-[12.5px]">
            <span className="text-text-secondary">Ward</span>
            <span className="font-medium text-text-primary">{selected?.ward}</span>
          </div>
          <div className="flex items-center justify-between border-b border-border pb-3 text-[12.5px]">
            <span className="text-text-secondary">Bed type</span>
            <span className="font-medium text-text-primary">{selected?.type}</span>
          </div>
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as BedStatus)}>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          {status === 'Occupied' && (
            <Input label="Patient name" value={patient} onChange={(e) => setPatient(e.target.value)} placeholder="Patient name" />
          )}
        </div>
      </Modal>
    </div>
  )
}
