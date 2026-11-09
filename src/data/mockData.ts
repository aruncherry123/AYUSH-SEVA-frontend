import type { AttendanceRecord, Database, LeaveRequest, RevenueRecord } from '../types'

export const TODAY = '2026-10-09'
export const ORG_ID = 'org-1'
export const MAIN_BRANCH_ID = 'br-1'
export const NORTH_BRANCH_ID = 'br-2'

const today = TODAY
const d = (offset: number) => {
  const base = new Date('2026-10-09T00:00:00Z')
  base.setUTCDate(base.getUTCDate() + offset)
  return base.toISOString().slice(0, 10)
}

const addDays = (date: string, offset: number) => {
  const base = new Date(`${date}T00:00:00Z`)
  base.setUTCDate(base.getUTCDate() + offset)
  return base.toISOString().slice(0, 10)
}

const isWeekday = (date: string) => {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay()
  return day !== 0 && day !== 6
}

const clock = (totalMinutes: number) => {
  const hour = Math.floor(totalMinutes / 60) % 24
  const minute = totalMinutes % 60
  const period = hour >= 12 ? 'PM' : 'AM'
  const display = hour % 12 || 12
  return `${String(display).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`
}

const seedLeaves: LeaveRequest[] = [
  { id: 'lve-1', organizationId: ORG_ID, branchId: MAIN_BRANCH_ID, userId: 'usr-3', employee: 'Emily Davis', department: 'ICU', type: 'Sick', from: d(-5), to: d(-4), days: 2, reason: 'Viral fever', status: 'Approved', appliedAt: d(-6), reviewedBy: 'Aarav Mehta', reviewedAt: d(-6), reviewNote: 'Approved. Rest and recover.' },
  { id: 'lve-2', organizationId: ORG_ID, branchId: MAIN_BRANCH_ID, userId: 'usr-2', employee: 'Dr. Sarah Johnson', department: 'Cardiology', type: 'Annual', from: d(10), to: d(16), days: 7, reason: 'Family vacation', status: 'Pending', appliedAt: today },
  { id: 'lve-3', organizationId: ORG_ID, branchId: MAIN_BRANCH_ID, userId: 'usr-4', employee: 'Lisa Thompson', department: 'Pharmacy', type: 'Casual', from: d(5), to: d(6), days: 2, reason: 'Family event', status: 'Approved', appliedAt: d(-2), reviewedBy: 'Aarav Mehta', reviewedAt: d(-1), reviewNote: 'Cover arranged with the evening pharmacist.' },
  { id: 'lve-4', organizationId: ORG_ID, branchId: NORTH_BRANCH_ID, userId: 'usr-5', employee: 'Robert Wilson', department: 'Administration', type: 'Casual', from: d(-2), to: d(-2), days: 1, reason: 'Personal errand', status: 'Rejected', appliedAt: d(-3), reviewedBy: 'Aarav Mehta', reviewedAt: d(-2), reviewNote: 'Month-end close requires cover.' },
  { id: 'lve-5', organizationId: ORG_ID, branchId: MAIN_BRANCH_ID, userId: 'usr-2', employee: 'Dr. Sarah Johnson', department: 'Cardiology', type: 'Sick', from: d(-1), to: d(-1), days: 1, reason: 'Migraine', status: 'Approved', appliedAt: d(-2), reviewedBy: 'Aarav Mehta', reviewedAt: d(-2) },
]

const staffSeed = [
  { userId: 'usr-1', name: 'Aarav Mehta', department: 'Administration', branchId: MAIN_BRANCH_ID, baseIn: 8 * 60 + 55 },
  { userId: 'usr-2', name: 'Dr. Sarah Johnson', department: 'Cardiology', branchId: MAIN_BRANCH_ID, baseIn: 8 * 60 + 40 },
  { userId: 'usr-3', name: 'Emily Davis', department: 'ICU', branchId: MAIN_BRANCH_ID, baseIn: 7 * 60 + 55 },
  { userId: 'usr-4', name: 'Lisa Thompson', department: 'Pharmacy', branchId: MAIN_BRANCH_ID, baseIn: 8 * 60 + 5 },
  { userId: 'usr-5', name: 'Robert Wilson', department: 'Administration', branchId: NORTH_BRANCH_ID, baseIn: 9 * 60 + 5 },
]

const buildAttendance = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = []
  const lastDay = Number(today.slice(8, 10))

  for (let day = 1; day <= lastDay; day++) {
    const date = `${today.slice(0, 8)}${String(day).padStart(2, '0')}`
    if (!isWeekday(date)) continue

    staffSeed.forEach((staff, index) => {
      if (staff.userId === 'usr-4' && day === 7) {
        records.push({
          id: `att-${staff.userId}-${date}`,
          organizationId: ORG_ID,
          branchId: staff.branchId,
          userId: staff.userId,
          employee: staff.name,
          department: staff.department,
          date,
          checkIn: '—',
          checkOut: '—',
          status: 'Absent',
          workedHours: 0,
        })
        return
      }

      const late = (day + index) % 8 === 0
      const overtime = (day + index) % 11 === 0
      const checkInMinute = staff.baseIn + (late ? 22 : index * 2)
      const checkOutMinute = 17 * 60 + (overtime ? 70 : 0) + index * 4
      const isToday = date === today

      records.push({
        id: `att-${staff.userId}-${date}`,
        organizationId: ORG_ID,
        branchId: staff.branchId,
        userId: staff.userId,
        employee: staff.name,
        department: staff.department,
        date,
        checkIn: clock(checkInMinute),
        checkOut: isToday ? '—' : clock(checkOutMinute),
        status: late ? 'Late' : overtime ? 'Overtime' : 'Present',
        workedHours: isToday ? undefined : Math.round(((checkOutMinute - checkInMinute) / 60) * 10) / 10,
      })
    })
  }

  // Approved leave becomes attendance, for past and future dates alike.
  seedLeaves
    .filter((leave) => leave.status === 'Approved')
    .forEach((leave) => {
      for (let offset = 0; offset < 90; offset++) {
        const date = addDays(leave.from, offset)
        if (date > leave.to) break
        if (!isWeekday(date)) continue
        const existing = records.find((row) => row.userId === leave.userId && row.date === date)
        if (existing) {
          existing.status = 'On Leave'
          existing.checkIn = '—'
          existing.checkOut = '—'
          existing.workedHours = 0
        } else {
          records.push({
            id: `att-leave-${leave.userId}-${date}`,
            organizationId: ORG_ID,
            branchId: leave.branchId,
            userId: leave.userId,
            employee: leave.employee,
            department: leave.department,
            date,
            checkIn: '—',
            checkOut: '—',
            status: 'On Leave',
            workedHours: 0,
          })
        }
      }
    })

  return records
}

/**
 * Deterministic daily revenue ledger used by the dashboard. The current
 * month (October 2026) is compared with the same date range in September.
 */
const buildRevenue = (year: number, month: number, days: number, dailyBase: number): RevenueRecord[] => {
  const departments = [
    { name: 'Cardiology', share: 0.16, service: 'Consultation & ECG' },
    { name: 'Orthopedics', share: 0.15, service: 'Orthopaedic procedures' },
    { name: 'Pediatrics', share: 0.12, service: 'Paediatric care' },
    { name: 'Neurology', share: 0.13, service: 'Neurology & imaging' },
    { name: 'Gynecology', share: 0.11, service: 'Maternity & gynae care' },
    { name: 'Emergency', share: 0.14, service: 'Emergency & trauma care' },
    { name: 'Laboratory', share: 0.1, service: 'Laboratory diagnostics' },
    { name: 'Pharmacy', share: 0.09, service: 'Pharmacy dispensing' },
  ]
  const methods: RevenueRecord['method'][] = ['Card', 'Insurance', 'UPI', 'Cash']
  const records: RevenueRecord[] = []

  for (let day = 1; day <= days; day++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dailyPulse = 1 + 0.08 * Math.sin((day * 5 + month * 2) * 0.7)
    departments.forEach((department, index) => {
      const jitter = 0.94 + ((day * 3 + index * 5) % 9) / 60
      records.push({
        id: `rev-${year}-${month + 1}-${day}-${index + 1}`,
        organizationId: ORG_ID,
        date,
        department: department.name,
        service: department.service,
        amount: Math.round(dailyBase * department.share * dailyPulse * jitter),
        method: methods[(day + index) % methods.length],
        status: (day + index * 2) % 11 === 0 ? 'Pending' : 'Received',
      })
    })
  }

  return records
}

export const seedDatabase: Database = {
  organizations: [
    {
      id: ORG_ID,
      name: 'Ayush Seva Multispeciality Hospital',
      email: 'admin@ayushseva.org',
      country: 'India',
      city: 'Bengaluru',
      plan: 'Professional',
      branchCount: 2,
      employeeCount: 148,
      status: 'Active',
      createdAt: '2025-04-18',
    },
  ],

  branches: [
    {
      id: MAIN_BRANCH_ID,
      organizationId: ORG_ID,
      name: 'Central Campus',
      code: 'AYS-CEN',
      city: 'Bengaluru',
      country: 'India',
      address: '14 Millers Road, Vasanth Nagar',
      phone: '+91 80 4123 9000',
      status: 'Active',
      createdAt: '2025-04-18',
    },
    {
      id: NORTH_BRANCH_ID,
      organizationId: ORG_ID,
      name: 'North Branch',
      code: 'AYS-NOR',
      city: 'Bengaluru',
      country: 'India',
      address: '22 Hebbal Ring Road, Sahakar Nagar',
      phone: '+91 80 4123 9100',
      status: 'Active',
      createdAt: '2025-11-02',
    },
  ],

  doctors: [
    { id: 'doc-1', name: 'Dr. Sarah Johnson', specialization: 'Interventional Cardiology', department: 'Cardiology', phone: '+1-555-0101', email: 'sarah.johnson@ayushseva.org', experience: 14, qualification: 'MD, DM (Cardiology)', availability: 'Mon–Fri, 09:00–15:00', gender: 'Female', status: 'Active', patientsTreated: 1280, rating: 4.9 },
    { id: 'doc-2', name: 'Dr. Michael Chen', specialization: 'Neurology', department: 'Neurology', phone: '+1-555-0102', email: 'michael.chen@ayushseva.org', experience: 11, qualification: 'MD, DM (Neurology)', availability: 'Mon–Thu, 10:00–16:00', gender: 'Male', status: 'Active', patientsTreated: 940, rating: 4.7 },
    { id: 'doc-3', name: 'Dr. Emily Davis', specialization: 'Pediatrics', department: 'Pediatrics', phone: '+1-555-0103', email: 'emily.davis@ayushseva.org', experience: 9, qualification: 'MD (Pediatrics)', availability: 'Mon–Sat, 08:00–14:00', gender: 'Female', status: 'Active', patientsTreated: 1520, rating: 4.8 },
    { id: 'doc-4', name: 'Dr. Rajesh Kumar', specialization: 'Orthopedics', department: 'Orthopedics', phone: '+1-555-0104', email: 'rajesh.kumar@ayushseva.org', experience: 17, qualification: 'MS (Ortho)', availability: 'Tue–Sat, 09:00–17:00', gender: 'Male', status: 'Active', patientsTreated: 760, rating: 4.6 },
    { id: 'doc-5', name: 'Dr. Aisha Rahman', specialization: 'Obstetrics & Gynecology', department: 'Gynecology', phone: '+1-555-0105', email: 'aisha.rahman@ayushseva.org', experience: 12, qualification: 'MD, DGO', availability: 'Mon–Fri, 11:00–18:00', gender: 'Female', status: 'On Leave', patientsTreated: 1105, rating: 4.9 },
    { id: 'doc-6', name: 'Dr. David Okafor', specialization: 'General Surgery', department: 'Surgery', phone: '+1-555-0106', email: 'david.okafor@ayushseva.org', experience: 20, qualification: 'MS (Gen Surgery)', availability: 'Mon–Wed, 10:00–16:00', gender: 'Male', status: 'Active', patientsTreated: 860, rating: 4.8 },
    { id: 'doc-7', name: 'Dr. Priya Nair', specialization: 'Dermatology', department: 'Dermatology', phone: '+1-555-0107', email: 'priya.nair@ayushseva.org', experience: 7, qualification: 'MD (Dermatology)', availability: 'Mon–Fri, 09:30–15:30', gender: 'Female', status: 'Active', patientsTreated: 1320, rating: 4.5 },
    { id: 'doc-8', name: 'Dr. James Whitfield', specialization: 'Emergency Medicine', department: 'Emergency', phone: '+1-555-0108', email: 'james.whitfield@ayushseva.org', experience: 10, qualification: 'MD (Emergency Med)', availability: 'Rotational', gender: 'Male', status: 'Active', patientsTreated: 2080, rating: 4.7 },
  ],

  employees: [
    { id: 'emp-1', name: 'Emily Davis', designation: 'Head Nurse', department: 'ICU', phone: '+1-555-0201', email: 'emily.davis@ayushseva.org', employeeCode: 'EMP-1001', joinDate: '2019-03-12', shift: 'Morning', gender: 'Female', status: 'Active' },
    { id: 'emp-2', name: 'Robert Wilson', designation: 'Administrator', department: 'Administration', phone: '+1-555-0202', email: 'robert.wilson@ayushseva.org', employeeCode: 'EMP-1002', joinDate: '2017-07-01', shift: 'Morning', gender: 'Male', status: 'Active' },
    { id: 'emp-3', name: 'Lisa Thompson', designation: 'Chief Pharmacist', department: 'Pharmacy', phone: '+1-555-0203', email: 'lisa.thompson@ayushseva.org', employeeCode: 'EMP-1003', joinDate: '2018-01-20', shift: 'Morning', gender: 'Female', status: 'Active' },
    { id: 'emp-4', name: 'Carlos Mendez', designation: 'Lab Technician', department: 'Laboratory', phone: '+1-555-0204', email: 'carlos.mendez@ayushseva.org', employeeCode: 'EMP-1004', joinDate: '2020-09-05', shift: 'Evening', gender: 'Male', status: 'Active' },
    { id: 'emp-5', name: 'Nadia Hassan', designation: 'Staff Nurse', department: 'Ward A', phone: '+1-555-0205', email: 'nadia.hassan@ayushseva.org', employeeCode: 'EMP-1005', joinDate: '2021-05-14', shift: 'Night', gender: 'Female', status: 'On Leave' },
    { id: 'emp-6', name: 'Tom Becker', designation: 'Radiographer', department: 'Radiology', phone: '+1-555-0206', email: 'tom.becker@ayushseva.org', employeeCode: 'EMP-1006', joinDate: '2016-11-02', shift: 'Morning', gender: 'Male', status: 'Active' },
    { id: 'emp-7', name: 'Grace Miller', designation: 'Receptionist', department: 'Front Desk', phone: '+1-555-0207', email: 'grace.miller@ayushseva.org', employeeCode: 'EMP-1007', joinDate: '2022-02-18', shift: 'Morning', gender: 'Female', status: 'Active' },
    { id: 'emp-8', name: 'Samuel Adeyemi', designation: 'Biomedical Engineer', department: 'Facilities', phone: '+1-555-0208', email: 'samuel.adeyemi@ayushseva.org', employeeCode: 'EMP-1008', joinDate: '2018-06-30', shift: 'Morning', gender: 'Male', status: 'Suspended' },
    { id: 'emp-9', name: 'Hannah Lee', designation: 'Staff Nurse', department: 'Emergency', phone: '+1-555-0209', email: 'hannah.lee@ayushseva.org', employeeCode: 'EMP-1009', joinDate: '2020-12-01', shift: 'Evening', gender: 'Female', status: 'Active' },
    { id: 'emp-10', name: 'Omar Farouk', designation: 'Ward Boy', department: 'Ward B', phone: '+1-555-0210', email: 'omar.farouk@ayushseva.org', employeeCode: 'EMP-1010', joinDate: '2023-04-10', shift: 'Night', gender: 'Male', status: 'Active' },
  ],

  departments: [
    { id: 'dep-1', name: 'Cardiology', head: 'Dr. Sarah Johnson', location: 'Block A, Floor 2', staffCount: 24, beds: 18, phone: '+1-555-0301', status: 'Active' },
    { id: 'dep-2', name: 'Neurology', head: 'Dr. Michael Chen', location: 'Block A, Floor 3', staffCount: 18, beds: 14, phone: '+1-555-0302', status: 'Active' },
    { id: 'dep-3', name: 'Pediatrics', head: 'Dr. Emily Davis', location: 'Block B, Floor 1', staffCount: 30, beds: 26, phone: '+1-555-0303', status: 'Active' },
    { id: 'dep-4', name: 'Orthopedics', head: 'Dr. Rajesh Kumar', location: 'Block C, Floor 2', staffCount: 16, beds: 20, phone: '+1-555-0304', status: 'Active' },
    { id: 'dep-5', name: 'Emergency', head: 'Dr. James Whitfield', location: 'Ground Floor', staffCount: 42, beds: 12, phone: '+1-555-0305', status: 'Active' },
    { id: 'dep-6', name: 'Pharmacy', head: 'Lisa Thompson', location: 'Ground Floor', staffCount: 12, beds: 0, phone: '+1-555-0306', status: 'Active' },
    { id: 'dep-7', name: 'Laboratory', head: 'Carlos Mendez', location: 'Basement 1', staffCount: 15, beds: 0, phone: '+1-555-0307', status: 'Active' },
  ],

  roles: [
    { id: 'role-1', name: 'Super Admin', description: 'Full organisation access across every module and branch', users: 1, permissions: ['all'], status: 'Active' },
    { id: 'role-2', name: 'Branch Admin', description: 'Runs a branch: operations, people, approvals and reporting', users: 1, permissions: ['dashboard.view', 'patients.view', 'patients.create', 'patients.edit', 'appointments.view', 'appointments.create', 'appointments.edit', 'appointments.cancel', 'clinical.view', 'clinical.edit', 'pharmacy.view', 'pharmacy.dispense', 'pharmacy.manage', 'inventory.view', 'inventory.manage', 'workforce.view', 'workforce.manage', 'workforce.approve', 'reports.view', 'reports.export', 'access.view', 'access.manage', 'settings.view'], status: 'Active' },
    { id: 'role-3', name: 'Doctor', description: 'Clinical records, appointments, prescriptions and assigned work', users: 1, permissions: ['dashboard.view', 'patients.view', 'patients.edit', 'appointments.view', 'appointments.edit', 'clinical.view', 'clinical.edit', 'pharmacy.view', 'workforce.view', 'reports.view'], status: 'Active' },
    { id: 'role-4', name: 'Staff', description: 'Self-service attendance, leave, assigned tasks and read-only clinical context', users: 2, permissions: ['dashboard.view', 'patients.view', 'appointments.view', 'inventory.view', 'workforce.view'], status: 'Active' },
  ],

  patients: [
    { id: 'pat-1', mrn: 'MRN-100241', name: 'John Smith', age: 45, gender: 'Male', phone: '+1-555-0401', email: 'john.smith@email.com', address: '123 Main St, Springfield', bloodGroup: 'A+', status: 'In Consultation', doctor: 'Dr. Sarah Johnson', diagnosis: 'Hypertension' },
    { id: 'pat-2', mrn: 'MRN-100242', name: 'Maria Garcia', age: 32, gender: 'Female', phone: '+1-555-0402', email: 'maria.garcia@email.com', address: '456 Oak Ave, Springfield', bloodGroup: 'O+', status: 'Admitted', doctor: 'Dr. Emily Davis', admittedAt: d(-2), ward: 'Ward A', bed: 'A-104', diagnosis: 'Post-operative recovery' },
    { id: 'pat-3', mrn: 'MRN-100243', name: 'James Wilson', age: 58, gender: 'Male', phone: '+1-555-0403', email: 'james.wilson@email.com', address: '789 Pine Rd, Springfield', bloodGroup: 'B+', status: 'In Consultation', doctor: 'Dr. Michael Chen', diagnosis: 'Migraine with aura' },
    { id: 'pat-4', mrn: 'MRN-100244', name: 'Sarah Brown', age: 28, gender: 'Female', phone: '+1-555-0404', email: 'sarah.brown@email.com', address: '321 Elm St, Springfield', bloodGroup: 'AB+', status: 'Discharged', doctor: 'Dr. Priya Nair', diagnosis: 'Contact dermatitis' },
    { id: 'pat-5', mrn: 'MRN-100245', name: 'David Lee', age: 67, gender: 'Male', phone: '+1-555-0405', email: 'david.lee@email.com', address: '654 Maple Dr, Springfield', bloodGroup: 'O-', status: 'Waiting', doctor: 'Dr. Michael Chen', diagnosis: 'Transient ischaemic attack' },
    { id: 'pat-6', mrn: 'MRN-100246', name: 'Amina Yusuf', age: 41, gender: 'Female', phone: '+1-555-0406', email: 'amina.yusuf@email.com', address: '12 Cedar Ln, Springfield', bloodGroup: 'A-', status: 'Admitted', doctor: 'Dr. David Okafor', admittedAt: d(-1), ward: 'Ward B', bed: 'B-208', diagnosis: 'Cholecystitis' },
    { id: 'pat-7', mrn: 'MRN-100247', name: 'Peter Novak', age: 55, gender: 'Male', phone: '+1-555-0407', email: 'peter.novak@email.com', address: '90 Birch Way, Springfield', bloodGroup: 'B-', status: 'Registered', doctor: 'Dr. Sarah Johnson', diagnosis: 'Chest pain evaluation' },
    { id: 'pat-8', mrn: 'MRN-100248', name: 'Lily Chen', age: 6, gender: 'Female', phone: '+1-555-0408', email: 'chen.family@email.com', address: '5 Aspen Ct, Springfield', bloodGroup: 'O+', status: 'Waiting', doctor: 'Dr. Emily Davis', diagnosis: 'Fever' },
  ],

  appointments: [
    { id: 'apt-1', patientName: 'John Smith', doctorName: 'Dr. Sarah Johnson', department: 'Cardiology', date: today, time: '09:00 AM', status: 'In Consultation', reason: 'Chest pain follow-up', type: 'Follow-up' },
    { id: 'apt-2', patientName: 'David Lee', doctorName: 'Dr. Michael Chen', department: 'Neurology', date: today, time: '10:30 AM', status: 'Waiting', reason: 'Headache and dizziness', type: 'OPD' },
    { id: 'apt-3', patientName: 'Lily Chen', doctorName: 'Dr. Emily Davis', department: 'Pediatrics', date: today, time: '11:15 AM', status: 'Scheduled', reason: 'High fever', type: 'OPD' },
    { id: 'apt-4', patientName: 'Amina Yusuf', doctorName: 'Dr. David Okafor', department: 'Surgery', date: today, time: '02:00 PM', status: 'Confirmed', reason: 'Post-op review', type: 'Follow-up' },
    { id: 'apt-5', patientName: 'Peter Novak', doctorName: 'Dr. Sarah Johnson', department: 'Cardiology', date: today, time: '03:30 PM', status: 'Confirmed', reason: 'ECG review', type: 'OPD' },
    { id: 'apt-6', patientName: 'Sarah Brown', doctorName: 'Dr. Priya Nair', department: 'Dermatology', date: d(1), time: '09:45 AM', status: 'Scheduled', reason: 'Skin allergy', type: 'Teleconsultation' },
    { id: 'apt-7', patientName: 'Maria Garcia', doctorName: 'Dr. Emily Davis', department: 'Pediatrics', date: d(1), time: '11:00 AM', status: 'Confirmed', reason: 'Post-visit review', type: 'Follow-up' },
    { id: 'apt-8', patientName: 'James Wilson', doctorName: 'Dr. Michael Chen', department: 'Neurology', date: d(2), time: '01:30 PM', status: 'Scheduled', reason: 'MRI results', type: 'Follow-up' },
  ],

  consultations: [
    { id: 'con-1', patientName: 'John Smith', doctorName: 'Dr. Sarah Johnson', date: today, time: '09:20 AM', diagnosis: 'Stage 1 Hypertension', notes: 'Started on Amlodipine 5mg. Advised salt restriction and 30 min daily walk.', status: 'In Progress' },
    { id: 'con-2', patientName: 'James Wilson', doctorName: 'Dr. Michael Chen', date: today, time: '08:40 AM', diagnosis: 'Migraine with aura', notes: 'Prescribed Sumatriptan. Scheduled MRI to rule out structural cause.', status: 'Completed' },
    { id: 'con-3', patientName: 'Sarah Brown', doctorName: 'Dr. Priya Nair', date: d(-1), time: '04:10 PM', diagnosis: 'Contact dermatitis', notes: 'Topical steroid cream. Advised avoiding known allergen.', status: 'Completed' },
    { id: 'con-4', patientName: 'Amina Yusuf', doctorName: 'Dr. David Okafor', date: d(-1), time: '11:00 AM', diagnosis: 'Acute Cholecystitis', notes: 'Admitted for laparoscopic cholecystectomy. Pre-op investigations ordered.', status: 'Completed' },
  ],

  prescriptions: [
    { id: 'prx-1', patientName: 'John Smith', doctorName: 'Dr. Sarah Johnson', date: today, items: 'Amlodipine 5mg — 1 tablet once daily (30 days)', status: 'Pending', notes: 'Review BP in 2 weeks.' },
    { id: 'prx-2', patientName: 'James Wilson', doctorName: 'Dr. Michael Chen', date: today, items: 'Sumatriptan 50mg — 1 tablet at onset (6 tablets)', status: 'Pending', notes: 'Avoid triggers, keep headache diary.' },
    { id: 'prx-3', patientName: 'Sarah Brown', doctorName: 'Dr. Priya Nair', date: d(-1), items: 'Hydrocortisone 1% cream — apply twice daily (7 days)', status: 'Dispensed', notes: 'Avoid scratching.' },
    { id: 'prx-4', patientName: 'Amina Yusuf', doctorName: 'Dr. David Okafor', date: d(-1), items: 'Ceftriaxone 1g IV — twice daily; Paracetamol 500mg — SOS', status: 'Dispensed', notes: 'Post-op antibiotic cover.' },
  ],

  attendance: buildAttendance(),

  shifts: [
    { id: 'shf-1', name: 'Morning Shift', department: 'ICU', startTime: '07:00 AM', endTime: '03:00 PM', staffCount: 12, supervisor: 'Emily Davis', status: 'Active' },
    { id: 'shf-2', name: 'Evening Shift', department: 'Emergency', startTime: '03:00 PM', endTime: '11:00 PM', staffCount: 9, supervisor: 'Hannah Lee', status: 'Active' },
    { id: 'shf-3', name: 'Night Shift', department: 'Ward A', startTime: '11:00 PM', endTime: '07:00 AM', staffCount: 8, supervisor: 'Nadia Hassan', status: 'Active' },
    { id: 'shf-4', name: 'Day Shift', department: 'Pharmacy', startTime: '08:00 AM', endTime: '04:00 PM', staffCount: 5, supervisor: 'Lisa Thompson', status: 'Active' },
  ],

  leaves: seedLeaves,

  tasks: [
    { id: 'tsk-1', organizationId: ORG_ID, branchId: MAIN_BRANCH_ID, title: 'Review lab results for Maria Garcia', assignedTo: 'Emily Davis', assignedToId: 'usr-3', assignedBy: 'Aarav Mehta', priority: 'High', status: 'In Progress', dueDate: today, department: 'ICU', description: 'Cross-check CBC and electrolytes post-op, then flag anything outside range.', createdAt: d(-2) },
    { id: 'tsk-2', organizationId: ORG_ID, branchId: MAIN_BRANCH_ID, title: 'Complete Ward A medication round', assignedTo: 'Emily Davis', assignedToId: 'usr-3', assignedBy: 'Aarav Mehta', priority: 'High', status: 'Assigned', dueDate: today, department: 'ICU', description: 'Evening round for beds 1–8, including observations.', createdAt: d(-1) },
    { id: 'tsk-3', organizationId: ORG_ID, branchId: MAIN_BRANCH_ID, title: 'Restock pharmacy inventory', assignedTo: 'Lisa Thompson', assignedToId: 'usr-4', assignedBy: 'Robert Wilson', priority: 'Medium', status: 'Overdue', dueDate: d(-1), department: 'Pharmacy', description: 'Reorder low-stock antibiotics and confirm delivery dates.', createdAt: d(-5) },
    { id: 'tsk-4', organizationId: ORG_ID, branchId: NORTH_BRANCH_ID, title: 'Approve October duty roster', assignedTo: 'Robert Wilson', assignedToId: 'usr-5', assignedBy: 'Aarav Mehta', priority: 'Medium', status: 'Pending', dueDate: today, department: 'Administration', description: 'Publish the roster after confirming weekend cover for both branches.', createdAt: d(-3) },
    { id: 'tsk-5', organizationId: ORG_ID, branchId: MAIN_BRANCH_ID, title: 'Update cardiology clinic notes', assignedTo: 'Dr. Sarah Johnson', assignedToId: 'usr-2', assignedBy: 'Aarav Mehta', priority: 'High', status: 'In Progress', dueDate: d(1), department: 'Cardiology', description: 'Close the outstanding notes for this week’s follow-up appointments.', createdAt: d(-1) },
    { id: 'tsk-6', organizationId: ORG_ID, branchId: NORTH_BRANCH_ID, title: 'Reconcile insurance claims', assignedTo: 'Robert Wilson', assignedToId: 'usr-5', assignedBy: 'Aarav Mehta', priority: 'Low', status: 'Completed', dueDate: d(-2), department: 'Administration', description: 'September claims reconciled and submitted to the insurer.', createdAt: d(-8), completedAt: d(-2) },
    { id: 'tsk-7', organizationId: ORG_ID, branchId: MAIN_BRANCH_ID, title: 'Quarterly X-ray calibration', assignedTo: 'Lisa Thompson', assignedToId: 'usr-4', assignedBy: 'Aarav Mehta', priority: 'Low', status: 'Assigned', dueDate: d(4), department: 'Pharmacy', description: 'Coordinate with biomedical engineering for the calibration visit.', createdAt: today },
  ],

  medicines: [
    { id: 'med-1', name: 'Paracetamol 500mg', genericName: 'Acetaminophen', category: 'Analgesic', manufacturer: 'PharmaCo', stock: 2480, minStock: 300, unit: 'Tablets', price: 0.05, expiryDate: d(400), batchNo: 'PC-2026-001', status: 'Available' },
    { id: 'med-2', name: 'Amoxicillin 250mg', genericName: 'Amoxicillin', category: 'Antibiotic', manufacturer: 'MediCare Labs', stock: 78, minStock: 150, unit: 'Capsules', price: 0.18, expiryDate: d(50), batchNo: 'MC-2026-045', status: 'Low Stock' },
    { id: 'med-3', name: 'Amlodipine 5mg', genericName: 'Amlodipine', category: 'Antihypertensive', manufacturer: 'CardioMed', stock: 640, minStock: 200, unit: 'Tablets', price: 0.09, expiryDate: d(320), batchNo: 'CM-2026-011', status: 'Available' },
    { id: 'med-4', name: 'Human Insulin', genericName: 'Insulin Human', category: 'Antidiabetic', manufacturer: 'BioMed', stock: 0, minStock: 30, unit: 'Vials', price: 12.5, expiryDate: d(-5), batchNo: 'BM-2026-012', status: 'Expired' },
    { id: 'med-5', name: 'Sumatriptan 50mg', genericName: 'Sumatriptan', category: 'Antimigraine', manufacturer: 'NeuroPharm', stock: 210, minStock: 60, unit: 'Tablets', price: 0.42, expiryDate: d(200), batchNo: 'NP-2026-007', status: 'Available' },
    { id: 'med-6', name: 'Ceftriaxone 1g', genericName: 'Ceftriaxone', category: 'Antibiotic', manufacturer: 'MediCare Labs', stock: 34, minStock: 50, unit: 'Vials', price: 3.2, expiryDate: d(90), batchNo: 'MC-2026-051', status: 'Low Stock' },
    { id: 'med-7', name: 'Salbutamol Inhaler', genericName: 'Salbutamol', category: 'Bronchodilator', manufacturer: 'RespiraPlus', stock: 120, minStock: 40, unit: 'Inhalers', price: 6.8, expiryDate: d(28), batchNo: 'RP-2026-019', status: 'Expiring' },
    { id: 'med-8', name: 'Ondansetron 4mg', genericName: 'Ondansetron', category: 'Antiemetic', manufacturer: 'PharmaCo', stock: 0, minStock: 100, unit: 'Tablets', price: 0.22, expiryDate: d(300), batchNo: 'PC-2026-033', status: 'Out of Stock' },
  ],

  suppliers: [
    { id: 'sup-1', name: 'MediCare Labs', contactPerson: 'Alan Reed', phone: '+1-555-0501', email: 'sales@medicare-labs.com', address: '100 Industrial Park, Springfield', category: 'Antibiotics', rating: 4.8, status: 'Active' },
    { id: 'sup-2', name: 'PharmaCo Distribution', contactPerson: 'Sonia Alvarez', phone: '+1-555-0502', email: 'orders@pharmaco.com', address: '44 Trade Ave, Springfield', category: 'General Medicines', rating: 4.5, status: 'Active' },
    { id: 'sup-3', name: 'BioMed Supplies', contactPerson: 'Ken Watanabe', phone: '+1-555-0503', email: 'contact@biomed.com', address: '7 Science Rd, Springfield', category: 'Biologics', rating: 4.2, status: 'Active' },
    { id: 'sup-4', name: 'RespiraPlus', contactPerson: 'Fatima Noor', phone: '+1-555-0504', email: 'info@respiraplus.com', address: '22 Health St, Springfield', category: 'Respiratory', rating: 4.6, status: 'Inactive' },
    { id: 'sup-5', name: 'MedEquip Global', contactPerson: 'Liam O\'Brien', phone: '+1-555-0505', email: 'b2b@medequip.com', address: '88 Commerce Blvd, Springfield', category: 'Equipment', rating: 4.4, status: 'Active' },
  ],

  purchaseOrders: [
    { id: 'po-1', supplier: 'MediCare Labs', items: 4, total: 12500, orderDate: d(-5), expectedDate: d(2), status: 'Ordered' },
    { id: 'po-2', supplier: 'PharmaCo Distribution', items: 12, total: 4820, orderDate: d(-9), expectedDate: d(-1), status: 'Received' },
    { id: 'po-3', supplier: 'BioMed Supplies', items: 3, total: 9800, orderDate: d(-2), expectedDate: d(6), status: 'Pending Approval' },
    { id: 'po-4', supplier: 'MedEquip Global', items: 2, total: 34500, orderDate: d(-15), expectedDate: d(-3), status: 'Partially Received' },
    { id: 'po-5', supplier: 'RespiraPlus', items: 6, total: 560, orderDate: d(-20), expectedDate: d(-12), status: 'Cancelled' },
  ],

  stockMovements: [
    { id: 'sm-1', item: 'Paracetamol 500mg', type: 'Out', quantity: 120, reference: 'Dispense #D-3391', date: today, handledBy: 'Lisa Thompson' },
    { id: 'sm-2', item: 'Amoxicillin 250mg', type: 'Out', quantity: 60, reference: 'Dispense #D-3390', date: d(-1), handledBy: 'Lisa Thompson' },
    { id: 'sm-3', item: 'Ceftriaxone 1g', type: 'In', quantity: 100, reference: 'PO-2 receipt', date: d(-2), handledBy: 'Robert Wilson' },
    { id: 'sm-4', item: 'Human Insulin', type: 'Adjustment', quantity: -20, reference: 'Expiry write-off', date: d(-3), handledBy: 'Lisa Thompson' },
    { id: 'sm-5', item: 'Salbutamol Inhaler', type: 'Out', quantity: 15, reference: 'Dispense #D-3388', date: d(-1), handledBy: 'Lisa Thompson' },
  ],

  revenue: [
    ...buildRevenue(2026, 8, 9, 18900),
    ...buildRevenue(2026, 9, 9, 21800),
  ],

  labTests: [
    { id: 'lab-1', patientName: 'Maria Garcia', testName: 'Complete Blood Count', requestedBy: 'Dr. Emily Davis', sampleType: 'Blood', requestedAt: d(-1), status: 'Processing', result: '' },
    { id: 'lab-2', patientName: 'David Lee', testName: 'MRI Brain', requestedBy: 'Dr. Michael Chen', sampleType: 'Imaging', requestedAt: d(-1), status: 'Sample Collected', result: '' },
    { id: 'lab-3', patientName: 'John Smith', testName: 'Lipid Profile', requestedBy: 'Dr. Sarah Johnson', sampleType: 'Blood', requestedAt: d(-2), status: 'Completed', result: 'LDL 142 mg/dL (high)' },
    { id: 'lab-4', patientName: 'Amina Yusuf', testName: 'Ultrasound Abdomen', requestedBy: 'Dr. David Okafor', sampleType: 'Imaging', requestedAt: d(-1), status: 'Report Approved', result: 'Gallstones present' },
    { id: 'lab-5', patientName: 'Lily Chen', testName: 'Dengue NS1 Antigen', requestedBy: 'Dr. Emily Davis', sampleType: 'Blood', requestedAt: today, status: 'Requested', result: '' },
  ],

  beds: [
    { id: 'bed-1', ward: 'Ward A', bedNumber: 'A-101', type: 'General', patientName: '', status: 'Available' },
    { id: 'bed-2', ward: 'Ward A', bedNumber: 'A-104', type: 'General', patientName: 'Maria Garcia', status: 'Occupied' },
    { id: 'bed-3', ward: 'Ward A', bedNumber: 'A-105', type: 'Semi-Private', patientName: '', status: 'Maintenance' },
    { id: 'bed-4', ward: 'Ward A', bedNumber: 'A-112', type: 'General', patientName: '', status: 'Reserved' },
    { id: 'bed-5', ward: 'Ward B', bedNumber: 'B-201', type: 'General', patientName: '', status: 'Available' },
    { id: 'bed-6', ward: 'Ward B', bedNumber: 'B-208', type: 'General', patientName: 'Amina Yusuf', status: 'Occupied' },
    { id: 'bed-7', ward: 'ICU', bedNumber: 'ICU-01', type: 'ICU', patientName: '', status: 'Available' },
    { id: 'bed-8', ward: 'ICU', bedNumber: 'ICU-02', type: 'ICU', patientName: '', status: 'Occupied' },
    { id: 'bed-9', ward: 'ICU', bedNumber: 'ICU-03', type: 'ICU', patientName: '', status: 'Available' },
    { id: 'bed-10', ward: 'Private', bedNumber: 'PV-01', type: 'Private', patientName: '', status: 'Reserved' },
    { id: 'bed-11', ward: 'Private', bedNumber: 'PV-02', type: 'Private', patientName: '', status: 'Available' },
    { id: 'bed-12', ward: 'Private', bedNumber: 'PV-03', type: 'Private', patientName: '', status: 'Occupied' },
  ],

  equipment: [
    { id: 'eq-1', name: 'MRI Scanner', category: 'Imaging', serialNo: 'MRI-4471', location: 'Radiology', purchaseDate: '2021-04-12', lastService: d(-90), status: 'In Use' },
    { id: 'eq-2', name: 'Ventilator', category: 'Life Support', serialNo: 'VEN-8890', location: 'ICU', purchaseDate: '2022-08-20', lastService: d(-30), status: 'In Use' },
    { id: 'eq-3', name: 'X-Ray Machine', category: 'Imaging', serialNo: 'XR-1132', location: 'Radiology', purchaseDate: '2019-01-15', lastService: d(-60), status: 'Under Maintenance' },
    { id: 'eq-4', name: 'ECG Machine', category: 'Diagnostic', serialNo: 'ECG-5520', location: 'Cardiology', purchaseDate: '2023-03-05', lastService: d(-20), status: 'Available' },
    { id: 'eq-5', name: 'Infusion Pump', category: 'Therapeutic', serialNo: 'INF-3310', location: 'Ward A', purchaseDate: '2022-11-11', lastService: d(-45), status: 'Available' },
    { id: 'eq-6', name: 'Defibrillator', category: 'Emergency', serialNo: 'DEF-7788', location: 'Emergency', purchaseDate: '2020-06-18', lastService: d(-15), status: 'In Use' },
    { id: 'eq-7', name: 'Ultrasound Scanner', category: 'Imaging', serialNo: 'US-9911', location: 'Gynecology', purchaseDate: '2018-09-24', lastService: d(-180), status: 'Damaged' },
    { id: 'eq-8', name: 'Dialysis Machine', category: 'Therapeutic', serialNo: 'DIA-2200', location: 'Nephrology', purchaseDate: '2017-02-28', lastService: d(-240), status: 'Retired' },
  ],

  maintenance: [
    { id: 'mnt-1', equipment: 'X-Ray Machine', type: 'Corrective', technician: 'Samuel Adeyemi', scheduledDate: today, cost: 450, status: 'In Progress' },
    { id: 'mnt-2', equipment: 'MRI Scanner', type: 'Preventive', technician: 'MedEquip Global', scheduledDate: d(3), cost: 1200, status: 'Scheduled' },
    { id: 'mnt-3', equipment: 'Ventilator', type: 'Inspection', technician: 'Samuel Adeyemi', scheduledDate: d(-2), cost: 0, status: 'Completed' },
    { id: 'mnt-4', equipment: 'Ultrasound Scanner', type: 'Corrective', technician: 'MedEquip Global', scheduledDate: d(-5), cost: 800, status: 'Overdue' },
  ],

  emergencyCases: [
    { id: 'emg-1', patientName: 'Unknown Male', age: 34, condition: 'Road traffic accident — head trauma', severity: 'Critical', arrivedAt: '08:12 AM', assignedDoctor: 'Dr. James Whitfield', status: 'In Treatment', notes: 'Intubated on arrival. CT head ordered; neurosurgery on standby.' },
    { id: 'emg-2', patientName: 'Rita Gomez', age: 51, condition: 'Acute chest pain', severity: 'High', arrivedAt: '09:05 AM', assignedDoctor: 'Dr. Sarah Johnson', status: 'Triage', notes: 'ECG shows ST elevation. Cath lab alerted; aspirin and heparin given.' },
    { id: 'emg-3', patientName: 'Noah Patel', age: 8, condition: 'Acute asthma exacerbation', severity: 'High', arrivedAt: '09:40 AM', assignedDoctor: 'Dr. Emily Davis', status: 'Stabilized', notes: 'Nebulised salbutamol twice. Oxygen saturation stable at 96%.' },
    { id: 'emg-4', patientName: 'Elena Kovacs', age: 62, condition: 'Suspected stroke', severity: 'Critical', arrivedAt: '10:02 AM', assignedDoctor: 'Dr. Michael Chen', status: 'In Treatment', notes: 'FAST positive on the left side. Stroke protocol activated, thrombolysis under review.' },
    { id: 'emg-5', patientName: 'Ben Carter', age: 27, condition: 'Laceration to forearm', severity: 'Low', arrivedAt: '10:25 AM', assignedDoctor: 'Dr. James Whitfield', status: 'Discharged', notes: 'Wound cleaned and sutured. Tetanus booster administered; dressing advice given.' },
  ],

  notifications: [
    { id: 'ntf-1', title: 'Low stock: Amoxicillin 250mg', message: 'Stock at 78 units, below minimum of 150. Consider reordering.', type: 'warning', read: false, timestamp: `${today} 08:30 AM`, category: 'Inventory' },
    { id: 'ntf-2', title: 'New appointment booked', message: 'Lily Chen with Dr. Emily Davis at 11:15 AM.', type: 'info', read: false, timestamp: `${today} 09:15 AM`, category: 'Appointments' },
    { id: 'ntf-3', title: 'Task overdue', message: '“Restock pharmacy inventory” is overdue.', type: 'error', read: false, timestamp: `${today} 07:00 AM`, category: 'Tasks' },
    { id: 'ntf-4', title: 'Critical emergency case', message: 'Head trauma case in Emergency — immediate review needed.', type: 'error', read: false, timestamp: `${today} 08:12 AM`, category: 'Emergency' },
    { id: 'ntf-5', title: 'Lab report approved', message: 'Complete Blood Count for Maria Garcia is ready to review.', type: 'success', read: true, timestamp: `${d(-1)} 04:30 PM`, category: 'Laboratory' },
    { id: 'ntf-6', title: 'Medicine nearing expiry', message: 'Salbutamol Inhaler (batch RP-2026-019) expires in 28 days.', type: 'warning', read: true, timestamp: `${d(-2)} 10:00 AM`, category: 'Inventory' },
  ],

  auditLogs: [
    { id: 'aud-1', user: 'Aarav Mehta', action: 'Logged in', module: 'Auth', target: '—', ipAddress: '192.168.1.10', timestamp: `${today} 07:55 AM`, severity: 'Info' },
    { id: 'aud-2', user: 'Dr. Sarah Johnson', action: 'Created prescription', module: 'Prescriptions', target: 'John Smith', ipAddress: '192.168.1.24', timestamp: `${today} 09:25 AM`, severity: 'Info' },
    { id: 'aud-3', user: 'Lisa Thompson', action: 'Adjusted stock', module: 'Inventory', target: 'Ceftriaxone 1g', ipAddress: '192.168.1.31', timestamp: `${today} 08:50 AM`, severity: 'Warning' },
    { id: 'aud-4', user: 'Robert Wilson', action: 'Deleted duplicate record', module: 'Patients', target: 'MRN-100199', ipAddress: '192.168.1.18', timestamp: `${d(-1)} 03:10 PM`, severity: 'Critical' },
    { id: 'aud-5', user: 'System', action: 'Nightly backup', module: 'System', target: 'Database', ipAddress: '127.0.0.1', timestamp: `${d(-1)} 02:00 AM`, severity: 'Info' },
  ],

  users: [
    {
      id: 'usr-1',
      organizationId: ORG_ID,
      branchId: MAIN_BRANCH_ID,
      name: 'Aarav Mehta',
      email: 'admin@ayushseva.org',
      role: 'Super Admin',
      avatar: 'AM',
      department: 'Administration',
      designation: 'Organisation Super Admin',
      employeeId: 'EMP-1000',
      phone: '+91 98450 11001',
      status: 'Active',
      passwordHash: 'fd7c1ec2fd22e943cdaa7121b04647408874a9f7ada70646ce42efdc4af7ed2f',
      passwordSalt: 'ayush-admin-2026',
      permissions: ['all'],
      mustChangePassword: false,
      createdAt: '2025-04-18',
      lastLoginAt: `${today}T07:55:00.000Z`,
    },
    {
      id: 'usr-2',
      organizationId: ORG_ID,
      branchId: MAIN_BRANCH_ID,
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@ayushseva.org',
      role: 'Doctor',
      avatar: 'SJ',
      department: 'Cardiology',
      designation: 'Consultant Cardiologist',
      employeeId: 'EMP-1001',
      phone: '+91 98450 11002',
      status: 'Active',
      passwordHash: '762d95aac47fcb1fc74e8a9c2a7b80723676231c5babbec4e8e159214ed1cf43',
      passwordSalt: 'ayush-doctor-2026',
      mustChangePassword: false,
      createdAt: '2025-05-02',
      lastLoginAt: `${d(-1)}T09:10:00.000Z`,
    },
    {
      id: 'usr-3',
      organizationId: ORG_ID,
      branchId: MAIN_BRANCH_ID,
      name: 'Emily Davis',
      email: 'emily.davis@ayushseva.org',
      role: 'Staff',
      avatar: 'ED',
      department: 'ICU',
      designation: 'Head Nurse',
      employeeId: 'EMP-1002',
      phone: '+91 98450 11003',
      status: 'Active',
      passwordHash: '6548d916c6d2a5c2a9b4eb6d7e7959ad2172a6586659f13ba6a74771a8f83cbb',
      passwordSalt: 'ayush-staff-2026',
      mustChangePassword: false,
      createdAt: '2025-06-14',
      lastLoginAt: `${today}T07:48:00.000Z`,
    },
    {
      id: 'usr-4',
      organizationId: ORG_ID,
      branchId: MAIN_BRANCH_ID,
      name: 'Lisa Thompson',
      email: 'lisa.thompson@ayushseva.org',
      role: 'Staff',
      avatar: 'LT',
      department: 'Pharmacy',
      designation: 'Chief Pharmacist',
      employeeId: 'EMP-1003',
      phone: '+91 98450 11004',
      status: 'Active',
      passwordHash: '5a3a4d53f18915e361966c8f5391e0d5966be23fa956df923e561c5d6a52cd3b',
      passwordSalt: 'ayush-branch-2026',
      mustChangePassword: false,
      createdAt: '2025-07-21',
      lastLoginAt: `${today}T08:01:00.000Z`,
    },
    {
      id: 'usr-5',
      organizationId: ORG_ID,
      branchId: NORTH_BRANCH_ID,
      name: 'Robert Wilson',
      email: 'robert.wilson@ayushseva.org',
      role: 'Branch Admin',
      avatar: 'RW',
      department: 'Administration',
      designation: 'Branch Administrator',
      employeeId: 'EMP-1004',
      phone: '+91 98450 11005',
      status: 'Active',
      passwordHash: '943c5074f00ec34f15c689a9b1416916c50a2ff2d9f7415059e000c777b3badf',
      passwordSalt: 'ayush-pharmacy-2026',
      mustChangePassword: false,
      createdAt: '2025-11-02',
      lastLoginAt: `${d(-1)}T09:05:00.000Z`,
    },
  ],
}
