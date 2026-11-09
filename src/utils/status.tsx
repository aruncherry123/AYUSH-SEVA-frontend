import { Badge } from '../components/ui/badge'
import type { ReactNode } from 'react'

const tone = {
  green: 'bg-[#ecfdf3] text-[#027a48]',
  blue: 'bg-[#eff4ff] text-[#175cd3]',
  amber: 'bg-[#fffaeb] text-[#b54708]',
  orange: 'bg-[#fff6ed] text-[#c4320a]',
  red: 'bg-[#fef3f2] text-[#b42318]',
  purple: 'bg-[#f4f3ff] text-[#5925dc]',
  teal: 'bg-[#f0fdf9] text-[#107569]',
  gray: 'bg-[#f2f4f7] text-[#475467]',
  pink: 'bg-primary-light text-primary',
}

const statusTone: Record<string, keyof typeof tone> = {
  // Appointments / consultations
  Scheduled: 'blue',
  Confirmed: 'teal',
  Waiting: 'amber',
  'In Consultation': 'purple',
  'In Progress': 'orange',
  'In Treatment': 'orange',
  'In Use': 'blue',
  'Incoming': 'blue',
  Triage: 'amber',
  Completed: 'green',
  Cancelled: 'red',
  'No Show': 'gray',
  Stabilized: 'green',
  // Tasks
  Assigned: 'blue',
  Pending: 'amber',
  Overdue: 'red',
  // Attendance
  Present: 'green',
  Absent: 'red',
  Late: 'orange',
  'Half Day': 'amber',
  'On Leave': 'blue',
  Holiday: 'purple',
  Overtime: 'teal',
  // Inventory
  Available: 'green',
  'Low Stock': 'amber',
  'Out of Stock': 'red',
  Expiring: 'orange',
  Expired: 'red',
  // Equipment
  'Under Maintenance': 'orange',
  Damaged: 'red',
  Retired: 'gray',
  // Beds
  Occupied: 'red',
  Reserved: 'amber',
  Maintenance: 'orange',
  // Lab
  Requested: 'blue',
  'Sample Collected': 'purple',
  Processing: 'orange',
  'Report Approved': 'green',
  // Purchases
  Draft: 'gray',
  'Pending Approval': 'amber',
  Ordered: 'blue',
  'Partially Received': 'orange',
  Received: 'green',
  // Staff
  Active: 'green',
  Invited: 'purple',
  Suspended: 'amber',
  Inactive: 'gray',
  // Patients
  Registered: 'blue',
  Admitted: 'purple',
  Discharged: 'green',
  // Misc
  Approved: 'green',
  Rejected: 'red',
  Dispensed: 'green',
  // Audit / severity
  Info: 'blue',
  Warning: 'amber',
  Critical: 'red',
  Severe: 'red',
  High: 'amber',
  Moderate: 'blue',
  Low: 'green',
}

const labels: Record<string, string> = {
  'In Progress': 'In Progress',
}

type StatusBadgeProps = { status: string; dot?: boolean } | string

export function StatusBadge(props: StatusBadgeProps): ReactNode {
  const status = typeof props === 'string' ? props : props.status
  const dot = typeof props === 'string' ? true : props.dot ?? true
  const t = statusTone[status] ?? 'gray'
  return (
    <Badge className={tone[t]} dot={dot}>
      {labels[status] ?? status}
    </Badge>
  )
}

export const getStatusBadge = (status: string) => <StatusBadge status={status} />
