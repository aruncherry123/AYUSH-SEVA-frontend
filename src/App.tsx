import { lazy, Suspense, useCallback, useState, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Activate from './pages/Activate'
import ChangePassword from './pages/ChangePassword'
import { LoadingState } from './components/ui/states'
import { SplashScreen } from './components/brand/SplashScreen'
import { RequireAuth, RequirePermission } from './components/auth/guards'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const PeopleDirectory = lazy(() => import('./pages/PeopleDirectory'))
const UsersAccess = lazy(() => import('./pages/UsersAccess'))
const RolesPermissions = lazy(() => import('./pages/RolesPermissions'))
const Patients = lazy(() => import('./pages/Patients'))
const PatientDetail = lazy(() => import('./pages/PatientDetail'))
const Appointments = lazy(() => import('./pages/Appointments'))
const Consultations = lazy(() => import('./pages/Consultations'))
const Attendance = lazy(() => import('./pages/Attendance'))
const Shifts = lazy(() => import('./pages/Shifts'))
const Leave = lazy(() => import('./pages/Leave'))
const EmployeeTasks = lazy(() => import('./pages/EmployeeTasks'))
const PerformanceHub = lazy(() => import('./pages/PerformanceHub'))
const PharmacyPrescriptions = lazy(() => import('./pages/PharmacyPrescriptions'))
const Stock = lazy(() => import('./pages/Stock'))
const Procurement = lazy(() => import('./pages/Procurement'))
const LabTests = lazy(() => import('./pages/LabTests'))
const BedsWards = lazy(() => import('./pages/BedsWards'))
const EquipmentHub = lazy(() => import('./pages/EquipmentHub'))
const Emergency = lazy(() => import('./pages/Emergency'))
const ReportsAnalytics = lazy(() => import('./pages/ReportsAnalytics'))
const AuditLogs = lazy(() => import('./pages/AuditLogs'))
const Settings = lazy(() => import('./pages/Settings'))
const NotFound = lazy(() => import('./pages/NotFound'))

const guard = (permission: string, element: ReactNode) => (
  <RequirePermission permission={permission}>{element}</RequirePermission>
)

function App() {
  const [booting, setBooting] = useState(true)
  const finishBoot = useCallback(() => setBooting(false), [])

  return (
    <BrowserRouter>
      {booting && <SplashScreen onComplete={finishBoot} />}
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingState label="Loading workspace..." /></div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/activate/:token" element={<Activate />} />
          <Route
            path="/change-password"
            element={
              <RequireAuth allowPasswordChange>
                <ChangePassword />
              </RequireAuth>
            }
          />
          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={guard('dashboard.view', <Dashboard />)} />
            <Route path="dashboard" element={guard('dashboard.view', <Dashboard />)} />

            <Route path="patients" element={guard('patients.view', <Patients />)} />
            <Route path="patients/:id" element={guard('patients.view', <PatientDetail />)} />
            <Route path="appointments" element={guard('appointments.view', <Appointments />)} />
            <Route path="clinical/consultations" element={guard('clinical.view', <Consultations />)} />
            <Route path="labs/tests" element={guard('clinical.view', <LabTests />)} />

            <Route path="people/directory" element={guard('workforce.view', <PeopleDirectory />)} />
            <Route path="people/users" element={guard('access.view', <UsersAccess />)} />
            <Route path="people/roles" element={guard('access.manage', <RolesPermissions />)} />

            <Route path="workforce/attendance" element={guard('workforce.view', <Attendance />)} />
            <Route path="workforce/shifts" element={guard('workforce.view', <Shifts />)} />
            <Route path="workforce/leave" element={guard('workforce.view', <Leave />)} />
            <Route path="workforce/tasks" element={guard('workforce.view', <EmployeeTasks />)} />
            <Route path="workforce/performance" element={guard('workforce.manage', <PerformanceHub />)} />

            <Route path="pharmacy/queue" element={guard('pharmacy.view', <PharmacyPrescriptions />)} />

            <Route path="inventory/stock" element={guard('inventory.view', <Stock />)} />
            <Route path="inventory/procurement" element={guard('inventory.view', <Procurement />)} />

            <Route path="facilities/beds" element={guard('clinical.view', <BedsWards />)} />
            <Route path="facilities/assets" element={guard('inventory.view', <EquipmentHub />)} />
            <Route path="facilities/emergency" element={guard('clinical.view', <Emergency />)} />

            <Route path="management/reports" element={guard('reports.view', <ReportsAnalytics />)} />
            <Route path="management/audit" element={guard('access.manage', <AuditLogs />)} />
            <Route path="settings" element={guard('settings.view', <Settings />)} />

            {/* Legacy paths fold into the consolidated hubs. */}
            <Route path="people/doctors" element={<Navigate to="/people/directory" replace />} />
            <Route path="people/employees" element={<Navigate to="/people/directory?tab=employees" replace />} />
            <Route path="people/departments" element={<Navigate to="/people/directory?tab=departments" replace />} />
            <Route path="clinical/inpatient" element={<Navigate to="/facilities/beds" replace />} />
            <Route path="clinical/admissions" element={<Navigate to="/facilities/beds" replace />} />
            <Route path="clinical/discharges" element={<Navigate to="/facilities/beds" replace />} />
            <Route path="clinical/prescriptions" element={<Navigate to="/pharmacy/queue" replace />} />
            <Route path="clinical/history" element={<Navigate to="/patients" replace />} />
            <Route path="workforce/workload" element={<Navigate to="/workforce/performance?tab=workload" replace />} />
            <Route path="workforce/progress" element={<Navigate to="/workforce/performance?tab=progress" replace />} />
            <Route path="pharmacy/medicines" element={<Navigate to="/inventory/stock?tab=catalogue" replace />} />
            <Route path="pharmacy/prescriptions" element={<Navigate to="/pharmacy/queue" replace />} />
            <Route path="pharmacy/dispensing" element={<Navigate to="/pharmacy/queue" replace />} />
            <Route path="inventory/suppliers" element={<Navigate to="/inventory/procurement" replace />} />
            <Route path="inventory/purchase-orders" element={<Navigate to="/inventory/procurement?tab=orders" replace />} />
            <Route path="inventory/movements" element={<Navigate to="/inventory/procurement?tab=movements" replace />} />
            <Route path="inventory/low-stock" element={<Navigate to="/inventory/stock?tab=replenishment" replace />} />
            <Route path="inventory/expiry" element={<Navigate to="/inventory/stock?tab=expiry" replace />} />
            <Route path="facilities/equipment" element={<Navigate to="/facilities/assets" replace />} />
            <Route path="facilities/maintenance" element={<Navigate to="/facilities/assets?tab=maintenance" replace />} />
            <Route path="management/notifications" element={<Navigate to="/dashboard" replace />} />
            <Route path="ai-assistant" element={<Navigate to="/dashboard" replace />} />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
