import { useEffect, useState } from 'react'
import { Modal } from '../ui/modal'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select } from '../ui/select'
import { Textarea } from '../ui/textarea'
import type { Patient, PatientStatus } from '../../types'

export const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
export const patientStatusOptions: PatientStatus[] = [
  'Registered',
  'Waiting',
  'In Consultation',
  'Admitted',
  'Discharged',
  'Inactive',
]
export const genderOptions = ['Male', 'Female', 'Other']

type Values = Record<string, string>

const emptyValues: Values = {
  name: '',
  mrn: '',
  age: '30',
  gender: 'Male',
  bloodGroup: 'O+',
  phone: '',
  email: '',
  address: '',
  doctor: '',
  status: 'Registered',
}

interface PatientFormModalProps {
  open: boolean
  onClose: () => void
  /** Existing patient to edit, or null to register a new one. */
  patient?: Patient | null
  saving?: boolean
  onSubmit: (values: Values) => void
}

export function PatientFormModal({ open, onClose, patient = null, saving = false, onSubmit }: PatientFormModalProps) {
  const [values, setValues] = useState<Values>(emptyValues)
  const [errors, setErrors] = useState<Values>({})

  useEffect(() => {
    if (!open) return
    if (patient) {
      setValues({
        name: patient.name,
        mrn: patient.mrn,
        age: String(patient.age),
        gender: patient.gender,
        bloodGroup: patient.bloodGroup,
        phone: patient.phone,
        email: patient.email ?? '',
        address: patient.address ?? '',
        doctor: patient.doctor ?? '',
        status: patient.status,
      })
    } else {
      setValues(emptyValues)
    }
    setErrors({})
  }, [open, patient])

  const set = (name: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setValues((prev) => ({ ...prev, [name]: event.target.value }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: Values = {}
    if (!values.name.trim()) next.name = 'Full name is required'
    if (!values.mrn.trim()) next.mrn = 'Medical record no. is required'
    if (!values.age.trim()) next.age = 'Age is required'
    if (!values.phone.trim()) next.phone = 'Phone is required'
    if (!Number.isNaN(Number(values.age)) && Number(values.age) < 0) next.age = 'Enter a valid age'
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) next.email = 'Enter a valid email address'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    onSubmit(values)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={patient ? 'Edit patient' : 'Register patient'}
      description={patient ? `Update the record for ${patient.name}.` : 'Add a new patient to the central registry.'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>{patient ? 'Save changes' : 'Register patient'}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Full name" required error={errors.name} placeholder="John Carter" value={values.name} onChange={set('name')} />
        <Input label="Medical record no." required error={errors.mrn} placeholder="MRN-100234" value={values.mrn} onChange={set('mrn')} />
        <Input label="Age" type="number" min={0} required error={errors.age} placeholder="30" value={values.age} onChange={set('age')} />
        <Select label="Gender" value={values.gender} onChange={set('gender')}>
          {genderOptions.map((g) => <option key={g} value={g}>{g}</option>)}
        </Select>
        <Select label="Blood group" value={values.bloodGroup} onChange={set('bloodGroup')}>
          {bloodGroupOptions.map((b) => <option key={b} value={b}>{b}</option>)}
        </Select>
        <Select label="Status" value={values.status} onChange={set('status')}>
          {patientStatusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Input label="Phone" type="tel" required error={errors.phone} placeholder="+1-555-0000" value={values.phone} onChange={set('phone')} />
        <Input label="Email" type="email" error={errors.email} placeholder="patient@email.com" value={values.email} onChange={set('email')} />
        <Input label="Attending doctor" placeholder="Dr. Jane Doe" value={values.doctor} onChange={set('doctor')} />
        <Textarea label="Address" placeholder="221 Baker Street, Springfield" className="sm:col-span-2" value={values.address} onChange={set('address')} />
        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </Modal>
  )
}
