import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Users,
  UserCog,
  Building2,
  ShieldCheck,
  Heart,
  CalendarDays,
  Stethoscope,
  BedDouble,
  FileText,
  ClipboardList,
  Clock,
  CalendarOff,
  CalendarClock,
  ListChecks,
  TrendingUp,
  Package,
  Truck,
  FlaskConical,
  Wrench,
  Siren,
  BarChart3,
  ScrollText,
  Settings,
} from 'lucide-react'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
  /** Permission required to see and open this destination. */
  permission?: string
}

export interface NavGroup {
  label: string
  icon: LucideIcon
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    label: 'Clinical',
    icon: ClipboardList,
    items: [
      { label: 'Consultations', path: '/clinical/consultations', icon: Stethoscope, permission: 'clinical.view' },
      { label: 'Lab Tests', path: '/labs/tests', icon: FlaskConical, permission: 'clinical.view' },
    ],
  },
  {
    label: 'People',
    icon: Users,
    items: [
      { label: 'Directory', path: '/people/directory', icon: Users, permission: 'workforce.view' },
      { label: 'Users & Access', path: '/people/users', icon: UserCog, permission: 'access.view' },
      { label: 'Roles & Permissions', path: '/people/roles', icon: ShieldCheck, permission: 'access.manage' },
    ],
  },
  {
    label: 'Workforce',
    icon: UserCog,
    items: [
      { label: 'Attendance', path: '/workforce/attendance', icon: Clock, permission: 'workforce.view' },
      { label: 'Shifts', path: '/workforce/shifts', icon: CalendarClock, permission: 'workforce.view' },
      { label: 'Leave Requests', path: '/workforce/leave', icon: CalendarOff, permission: 'workforce.view' },
      { label: 'Tasks', path: '/workforce/tasks', icon: ListChecks, permission: 'workforce.view' },
      { label: 'Performance', path: '/workforce/performance', icon: TrendingUp, permission: 'workforce.manage' },
    ],
  },
  {
    label: 'Pharmacy & Inventory',
    icon: Package,
    items: [
      { label: 'Pharmacy Queue', path: '/pharmacy/queue', icon: FileText, permission: 'pharmacy.view' },
      { label: 'Inventory', path: '/inventory/stock', icon: Package, permission: 'inventory.view' },
      { label: 'Procurement', path: '/inventory/procurement', icon: Truck, permission: 'inventory.view' },
    ],
  },
  {
    label: 'Facilities',
    icon: Building2,
    items: [
      { label: 'Beds & Wards', path: '/facilities/beds', icon: BedDouble, permission: 'clinical.view' },
      { label: 'Equipment', path: '/facilities/assets', icon: Wrench, permission: 'inventory.view' },
    ],
  },
  {
    label: 'Insights',
    icon: BarChart3,
    items: [
      { label: 'Reports & Analytics', path: '/management/reports', icon: BarChart3, permission: 'reports.view' },
      { label: 'Audit Logs', path: '/management/audit', icon: ScrollText, permission: 'access.manage' },
    ],
  },
]

export const topItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
  { label: 'Patients', path: '/patients', icon: Heart, permission: 'patients.view' },
  { label: 'Appointments', path: '/appointments', icon: CalendarDays, permission: 'appointments.view' },
  { label: 'Emergency', path: '/facilities/emergency', icon: Siren, permission: 'clinical.view' },
]

export const bottomItems: NavItem[] = [
  { label: 'Settings', path: '/settings', icon: Settings, permission: 'settings.view' },
]

export const mobilePrimary: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
  { label: 'Patients', path: '/patients', icon: Heart, permission: 'patients.view' },
  { label: 'Appointments', path: '/appointments', icon: CalendarDays, permission: 'appointments.view' },
  { label: 'Tasks', path: '/workforce/tasks', icon: ListChecks, permission: 'workforce.view' },
]

const labelMap: Record<string, string> = {
  dashboard: 'Dashboard',
  people: 'People',
  directory: 'Directory',
  users: 'Users & Access',
  roles: 'Roles & Permissions',
  patients: 'Patients',
  appointments: 'Appointments',
  clinical: 'Clinical',
  consultations: 'Consultations',
  pharmacy: 'Pharmacy',
  queue: 'Pharmacy Queue',
  inventory: 'Inventory',
  stock: 'Inventory',
  procurement: 'Procurement',
  workforce: 'Workforce',
  attendance: 'Attendance',
  shifts: 'Shifts',
  leave: 'Leave Requests',
  tasks: 'Tasks',
  performance: 'Performance',
  labs: 'Laboratory',
  tests: 'Lab Tests',
  facilities: 'Facilities',
  beds: 'Beds & Wards',
  assets: 'Equipment',
  emergency: 'Emergency Triage',
  management: 'Insights',
  reports: 'Reports & Analytics',
  audit: 'Audit Logs',
  settings: 'Settings',
}

const pathLabels: Record<string, string> = {
  '/pharmacy/queue': 'Pharmacy Queue',
  '/inventory/stock': 'Inventory',
  '/facilities/assets': 'Equipment',
  '/people/directory': 'Directory',
}

export function breadcrumbsFor(pathname: string): { label: string; path: string }[] {
  const segments = pathname.split('/').filter(Boolean)
  const crumbs: { label: string; path: string }[] = []
  let acc = ''
  segments.forEach((seg) => {
    acc += `/${seg}`
    crumbs.push({ label: pathLabels[acc] ?? labelMap[seg] ?? seg, path: acc })
  })
  return crumbs
}
