import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Building2,
  Bell,
  Shield,
  Palette,
  Save,
  Mail,
  Phone,
  MapPin,
  BadgeCheck,
  Check,
} from 'lucide-react'
import { PageHeader } from '../components/common/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Select } from '../components/ui/select'
import { Switch } from '../components/ui/switch'
import { Avatar } from '../components/ui/avatar'
import { SideTabs } from '../components/ui/tabs'
import { useToast } from '../state/ToastContext'
import { useAuth } from '../state/AuthContext'
import { useStore } from '../state/StoreContext'

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'hospital', label: 'Hospital', icon: Building2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
] as const

type TabId = (typeof tabs)[number]['id']

const sectionMeta: Record<TabId, { title: string; description: string }> = {
  profile: {
    title: 'Profile',
    description: 'Your personal details and how they appear across the workspace.',
  },
  hospital: {
    title: 'Hospital',
    description: 'Registration, contact and operational defaults for Ayush Seva Central.',
  },
  notifications: {
    title: 'Notifications',
    description: 'Choose the events you want to hear about and how often.',
  },
  security: {
    title: 'Security',
    description: 'Password, verification and active session controls for your account.',
  },
  appearance: {
    title: 'Appearance',
    description: 'Density, motion and accent colour for this device.',
  },
}

const notificationRows = [
  ['appointmentAlerts', 'Appointment alerts', 'New, rescheduled and cancelled appointments'],
  ['stockAlerts', 'Stock alerts', 'Medicines that fall below their minimum threshold'],
  ['emergencyAlerts', 'Emergency alerts', 'Real-time alerts for incoming emergency cases'],
  ['emailDigest', 'Daily email digest', 'A morning summary of operations'],
  ['weeklyReport', 'Weekly report', 'A performance report every Monday'],
] as const

const accentOptions = [
  { value: '#2563EB', label: 'Clinical blue' },
  { value: '#0F766E', label: 'Teal' },
  { value: '#7C3AED', label: 'Violet' },
  { value: '#B45309', label: 'Amber' },
  { value: '#475569', label: 'Graphite' },
]

export default function Settings() {
  const toast = useToast()
  const navigate = useNavigate()
  const { user, can } = useAuth()
  const { db } = useStore()
  const organization = db.organizations.find((org) => org.id === user?.organizationId)
  const branch = db.branches.find((item) => item.id === user?.branchId)
  const [tab, setTab] = useState<TabId>('profile')
  const [accent, setAccent] = useState('#2563EB')
  const [prefs, setPrefs] = useState({
    appointmentAlerts: true,
    stockAlerts: true,
    emergencyAlerts: true,
    emailDigest: false,
    weeklyReport: true,
    twoFactor: true,
    compactMode: false,
    animations: true,
  })

  const toggle = (key: keyof typeof prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }))
  const save = () => toast.success('Settings saved', 'Your preferences have been updated.')

  const meta = sectionMeta[tab]

  return (
    <div className="space-y-6">
      <PageHeader
        variant="compact"
        eyebrow="Workspace configuration"
        title="Settings"
        description="Manage your profile, hospital preferences and system configuration."
        actions={
          can('settings.manage') ? (
            <Button onClick={save}>
              <Save size={15} /> Save changes
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[216px_minmax(0,1fr)] xl:grid-cols-[236px_minmax(0,1fr)]">
        <aside className="self-start lg:sticky lg:top-0">
          <h2 className="label-micro mb-3 hidden lg:block">Sections</h2>
          <SideTabs
            tabs={tabs.map((t) => ({ id: t.id, label: t.label, icon: t.icon }))}
            active={tab}
            onChange={(id) => setTab(id as TabId)}
            ariaLabel="Settings sections"
          />

          <div className="mt-5 hidden rounded-lg border border-border p-3.5 lg:block">
            <p className="label-micro">Session</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#039855]" aria-hidden="true" />
              <p className="text-[12px] font-medium text-text-primary">Active</p>
            </div>
            <p className="mt-1 text-[11.5px] leading-4 text-text-tertiary">
              Signed in as {user?.email ?? '—'} on {organization?.name ?? 'your organisation'}.
            </p>
          </div>
        </aside>

        <section className="min-w-0 xl:max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>{meta.title}</CardTitle>
              <CardDescription>{meta.description}</CardDescription>
            </CardHeader>
            <CardContent>{renderSection()}</CardContent>
          </Card>
        </section>
      </div>
    </div>
  )

  function renderSection() {
    if (tab === 'profile') {
      return (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-4 border-b border-border pb-5">
            <Avatar name={user?.name ?? 'Your profile'} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[15px] font-semibold text-text-primary">{user?.name ?? 'Your profile'}</p>
                <span className="inline-flex items-center gap-1 rounded-md bg-primary-light px-1.5 py-0.5 text-[10.5px] font-medium text-primary">
                  <BadgeCheck size={11} /> {user?.status ?? 'Active'}
                </span>
              </div>
              <p className="mt-0.5 text-[12.5px] text-text-secondary">
                {user?.designation ?? 'Team member'} · {user?.department ?? '—'}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-text-secondary">
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={12} className="text-text-tertiary" /> {user?.email ?? '—'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Phone size={12} className="text-text-tertiary" /> {user?.phone ?? '—'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={12} className="text-text-tertiary" /> {branch?.name ?? organization?.name ?? '—'}
                </span>
              </div>
            </div>
            <Button variant="outline" onClick={() => toast.success('Photo picker is not available in this demo')}>
              Change photo
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Full name" defaultValue={user?.name ?? ''} />
            <Input label="Role" defaultValue={user?.role ?? ''} disabled />
            <Input label="Email" type="email" defaultValue={user?.email ?? ''} />
            <Input label="Phone" defaultValue={user?.phone ?? ''} />
            <Select label="Department" defaultValue={user?.department ?? 'Administration'}>
              {Array.from(
                new Set([
                  ...(user?.department ? [user.department] : []),
                  'Administration',
                  'Cardiology',
                  'Neurology',
                  'Emergency',
                ]),
              ).map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
            <Input label="Employee ID" defaultValue={user?.employeeId ?? ''} disabled />
          </div>
        </div>
      )
    }

    if (tab === 'hospital') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Organisation name" defaultValue={organization?.name ?? ''} />
            <Input label="Subscription plan" defaultValue={organization?.plan ?? ''} disabled />
            <Input label="Organisation email" type="email" defaultValue={organization?.email ?? ''} />
            <Input label="Country" defaultValue={organization?.country ?? ''} disabled />
            <Input label="City" defaultValue={organization?.city ?? ''} disabled />
            <Input label="Branches" defaultValue={String(organization?.branchCount ?? db.branches.filter((b) => b.organizationId === user?.organizationId).length)} disabled />
          </div>
          <Textarea
            label="Primary branch"
            defaultValue={
              branch
                ? `${branch.name} (${branch.code}) · ${branch.address}, ${branch.city}, ${branch.country}`
                : 'No branch assigned.'
            }
            disabled
          />
          <div className="rounded-lg bg-bg-secondary p-3 text-[11.5px] leading-5 text-text-secondary">
            Organisation details are managed by your Super Admin. Branch addresses, contact numbers and working hours
            can be maintained from Users &amp; Access.
          </div>
        </div>
      )
    }

    if (tab === 'notifications') {
      return (
        <div className="divide-y divide-border">
          {notificationRows.map(([key, title, description]) => (
            <div key={key} className="py-3.5 first:pt-0 last:pb-0">
              <Switch
                label={title}
                description={description}
                checked={prefs[key]}
                onChange={() => toggle(key)}
              />
            </div>
          ))}
        </div>
      )
    }

    if (tab === 'security') {
      return (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[13px] font-medium text-text-primary">Password</p>
              <p className="mt-0.5 text-[11.5px] text-text-secondary">
                Change the password used to sign in to this workspace.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/change-password')}>
              Change password
            </Button>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
            <div>
              <p className="text-[13px] font-medium text-text-primary">Two-factor authentication</p>
              <p className="mt-0.5 text-[11.5px] text-text-secondary">Add an extra layer of security to your account</p>
            </div>
            <Switch checked={prefs.twoFactor} onChange={() => toggle('twoFactor')} label="Two-factor authentication" />
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
            <div>
              <p className="text-[13px] font-medium text-text-primary">Active session</p>
              <p className="mt-0.5 text-[11.5px] text-text-secondary">
                {user?.email ?? '—'} · {branch?.name ?? organization?.name ?? '—'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => toast.success('Other sessions signed out')}>
              Sign out others
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-5">
        <div className="divide-y divide-border">
          <div className="pb-3.5">
            <Switch
              label="Compact mode"
              description="Reduce spacing to fit more content on screen"
              checked={prefs.compactMode}
              onChange={() => toggle('compactMode')}
            />
          </div>
          <div className="pt-3.5">
            <Switch
              label="Interface animations"
              description="Enable subtle transitions and motion"
              checked={prefs.animations}
              onChange={() => toggle('animations')}
            />
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-[13px] font-medium text-text-primary">Accent colour</p>
          <p className="mt-0.5 text-[11.5px] text-text-secondary">
            Used for primary actions and active navigation on this device.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {accentOptions.map((option) => {
              const isActive = accent === option.value
              return (
                <button
                  key={option.value}
                  onClick={() => setAccent(option.value)}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[12px] transition-colors ${
                    isActive
                      ? 'border-border-strong bg-bg-secondary font-medium text-text-primary'
                      : 'border-border text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                  }`}
                  aria-pressed={isActive}
                >
                  <span
                    className="flex h-4 w-4 items-center justify-center rounded-full"
                    style={{ background: option.value }}
                  >
                    {isActive && <Check size={10} className="text-white" strokeWidth={3} />}
                  </span>
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
}
