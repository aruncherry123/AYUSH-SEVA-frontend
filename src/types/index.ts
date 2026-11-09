export type ID = string

export type Gender = 'Male' | 'Female' | 'Other'
export type Priority = 'High' | 'Medium' | 'Low'

export type EmployeeStatus = 'Active' | 'On Leave' | 'Suspended' | 'Inactive'
export type UserRole = 'Super Admin' | 'Branch Admin' | 'Doctor' | 'Staff'
export type UserAccountStatus = 'Active' | 'Invited' | 'Inactive' | 'Suspended'
export type SubscriptionPlan = 'Starter' | 'Professional' | 'Enterprise'
export type CredentialMode = 'temporary' | 'invitation'
export type LeaveType = 'Sick' | 'Casual' | 'Annual' | 'Maternity' | 'Unpaid'
export type DoctorStatus = 'Active' | 'On Leave' | 'Inactive'
export type PatientStatus = 'Registered' | 'Waiting' | 'In Consultation' | 'Admitted' | 'Discharged' | 'Inactive'
export type AppointmentStatus = 'Scheduled' | 'Confirmed' | 'Waiting' | 'In Consultation' | 'Completed' | 'Cancelled' | 'No Show'
export type TaskStatus = 'Assigned' | 'In Progress' | 'Completed' | 'Pending' | 'Overdue' | 'Cancelled'
export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Half Day' | 'On Leave' | 'Holiday' | 'Overtime'
export type StockStatus = 'Available' | 'Low Stock' | 'Out of Stock' | 'Expiring' | 'Expired'
export type EquipmentStatus = 'Available' | 'In Use' | 'Under Maintenance' | 'Damaged' | 'Retired'
export type BedStatus = 'Available' | 'Occupied' | 'Reserved' | 'Maintenance'
export type LabStatus = 'Requested' | 'Sample Collected' | 'Processing' | 'Completed' | 'Report Approved'
export type PurchaseStatus = 'Draft' | 'Pending Approval' | 'Ordered' | 'Partially Received' | 'Received' | 'Cancelled'
export type PrescriptionStatus = 'Pending' | 'Dispensed' | 'Cancelled'
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'
export type ConsultationStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled'
export type EmergencySeverity = 'Critical' | 'High' | 'Moderate' | 'Low'
export type EmergencyStatus = 'Incoming' | 'Triage' | 'In Treatment' | 'Stabilized' | 'Discharged'

export interface Doctor {
  id: ID
  name: string
  specialization: string
  department: string
  phone: string
  email: string
  experience: number
  qualification: string
  availability: string
  gender: Gender
  status: DoctorStatus
  patientsTreated: number
  rating: number
}

export interface Employee {
  id: ID
  name: string
  designation: string
  department: string
  phone: string
  email: string
  employeeCode: string
  joinDate: string
  shift: 'Morning' | 'Evening' | 'Night'
  gender: Gender
  status: EmployeeStatus
}

export interface Department {
  id: ID
  name: string
  head: string
  location: string
  staffCount: number
  beds: number
  phone: string
  status: 'Active' | 'Inactive'
}

export interface Role {
  id: ID
  name: string
  description: string
  users: number
  permissions: string[]
  status: 'Active' | 'Inactive'
}

export interface Patient {
  id: ID
  mrn: string
  name: string
  age: number
  gender: Gender
  phone: string
  email: string
  address: string
  bloodGroup: string
  status: PatientStatus
  doctor: string
  admittedAt?: string
  ward?: string
  bed?: string
  diagnosis?: string
}

export interface Appointment {
  id: ID
  patientName: string
  doctorName: string
  department: string
  date: string
  time: string
  status: AppointmentStatus
  reason: string
  type: 'OPD' | 'Follow-up' | 'Emergency' | 'Teleconsultation'
}

export interface Consultation {
  id: ID
  patientName: string
  doctorName: string
  date: string
  time: string
  diagnosis: string
  notes: string
  status: ConsultationStatus
}

export interface Prescription {
  id: ID
  patientName: string
  doctorName: string
  date: string
  items: string
  status: PrescriptionStatus
  notes: string
}

export interface AttendanceRecord {
  id: ID
  organizationId: ID
  branchId: ID
  userId: ID
  employee: string
  department: string
  date: string
  checkIn: string
  checkOut: string
  status: AttendanceStatus
  workedHours?: number
  note?: string
}

export interface Shift {
  id: ID
  name: string
  department: string
  startTime: string
  endTime: string
  staffCount: number
  supervisor: string
  status: 'Active' | 'Inactive'
}

export interface LeaveRequest {
  id: ID
  organizationId: ID
  branchId: ID
  userId: ID
  employee: string
  department: string
  type: LeaveType
  from: string
  to: string
  days: number
  reason: string
  status: LeaveStatus
  appliedAt: string
  reviewedBy?: string
  reviewedAt?: string
  reviewNote?: string
}

export interface Task {
  id: ID
  organizationId: ID
  branchId: ID
  title: string
  assignedTo: string
  assignedToId?: ID
  assignedBy?: string
  priority: Priority
  status: TaskStatus
  dueDate: string
  department: string
  description: string
  createdAt?: string
  completedAt?: string
}

export interface Medicine {
  id: ID
  name: string
  genericName: string
  category: string
  manufacturer: string
  stock: number
  minStock: number
  unit: string
  price: number
  expiryDate: string
  batchNo: string
  status: StockStatus
}

export interface Supplier {
  id: ID
  name: string
  contactPerson: string
  phone: string
  email: string
  address: string
  category: string
  rating: number
  status: 'Active' | 'Inactive'
}

export interface PurchaseOrder {
  id: ID
  supplier: string
  items: number
  total: number
  orderDate: string
  expectedDate: string
  status: PurchaseStatus
}

export interface StockMovement {
  id: ID
  item: string
  type: 'In' | 'Out' | 'Adjustment' | 'Return'
  quantity: number
  reference: string
  date: string
  handledBy: string
}

export type RevenueStatus = 'Received' | 'Pending'

export interface RevenueRecord {
  id: ID
  organizationId?: ID
  date: string
  department: string
  service: string
  amount: number
  method: 'Cash' | 'Card' | 'Insurance' | 'UPI'
  status: RevenueStatus
}

export interface LabTest {
  id: ID
  patientName: string
  testName: string
  requestedBy: string
  sampleType: string
  requestedAt: string
  status: LabStatus
  result: string
}

export interface Bed {
  id: ID
  ward: string
  bedNumber: string
  type: 'General' | 'ICU' | 'Private' | 'Semi-Private'
  patientName: string
  status: BedStatus
}

export interface Equipment {
  id: ID
  name: string
  category: string
  serialNo: string
  location: string
  purchaseDate: string
  lastService: string
  status: EquipmentStatus
}

export interface MaintenanceRecord {
  id: ID
  equipment: string
  type: 'Preventive' | 'Corrective' | 'Inspection'
  technician: string
  scheduledDate: string
  cost: number
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Overdue'
}

export interface EmergencyCase {
  id: ID
  patientName: string
  age: number
  condition: string
  severity: EmergencySeverity
  arrivedAt: string
  assignedDoctor: string
  status: EmergencyStatus
  notes?: string
}

export interface AppNotification {
  id: ID
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  read: boolean
  timestamp: string
  category: string
}

export interface AuditLog {
  id: ID
  user: string
  action: string
  module: string
  target: string
  ipAddress: string
  timestamp: string
  severity: 'Info' | 'Warning' | 'Critical'
}

export interface Organization {
  id: ID
  name: string
  email: string
  country: string
  city: string
  plan: SubscriptionPlan
  branchCount: number
  employeeCount: number
  status: 'Active' | 'Suspended'
  createdAt: string
}

export interface Branch {
  id: ID
  organizationId: ID
  name: string
  code: string
  city: string
  country: string
  address: string
  phone: string
  status: 'Active' | 'Inactive'
  createdAt: string
}

export interface User {
  id: ID
  organizationId: ID
  branchId: ID
  name: string
  email: string
  role: UserRole
  avatar: string
  department: string
  designation: string
  employeeId: string
  phone?: string
  status: UserAccountStatus
  passwordHash?: string
  passwordSalt?: string
  /** Optional per-user override; when absent the role grants apply. */
  permissions?: string[]
  mustChangePassword?: boolean
  activationToken?: string
  invitedAt?: string
  lastLoginAt?: string
  createdAt: string
}

export interface Database {
  organizations: Organization[]
  branches: Branch[]
  doctors: Doctor[]
  employees: Employee[]
  departments: Department[]
  roles: Role[]
  patients: Patient[]
  appointments: Appointment[]
  consultations: Consultation[]
  prescriptions: Prescription[]
  attendance: AttendanceRecord[]
  shifts: Shift[]
  leaves: LeaveRequest[]
  tasks: Task[]
  medicines: Medicine[]
  suppliers: Supplier[]
  purchaseOrders: PurchaseOrder[]
  stockMovements: StockMovement[]
  revenue: RevenueRecord[]
  labTests: LabTest[]
  beds: Bed[]
  equipment: Equipment[]
  maintenance: MaintenanceRecord[]
  emergencyCases: EmergencyCase[]
  notifications: AppNotification[]
  auditLogs: AuditLog[]
  users: User[]
}

export type StoreKey = keyof Database
