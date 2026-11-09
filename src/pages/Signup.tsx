import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Check,
  Hospital,
  Layers3,
  Lock,
  Mail,
  MapPin,
  Network,
  Stethoscope,
  User,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AuthShell } from '../components/auth/AuthShell'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useAuth } from '../state/AuthContext'
import type { SubscriptionPlan } from '../types'

const plans: { id: SubscriptionPlan; description: string; detail: string; icon: LucideIcon }[] = [
  { id: 'Starter', description: 'Single-site clinics', detail: 'Core records and workforce', icon: Stethoscope },
  { id: 'Professional', description: 'Growing hospitals', detail: 'Multi-branch operations', icon: Hospital },
  { id: 'Enterprise', description: 'Hospital groups', detail: 'Advanced controls and reporting', icon: Network },
]

interface SectionHeadingProps {
  step: string
  icon: React.ReactNode
  title: string
  hint: string
}

const SectionHeading = ({ step, icon, title, hint }: SectionHeadingProps) => (
  <div className="mb-4 flex items-start gap-3">
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-primary-border bg-primary-light text-[10.5px] font-semibold text-primary tabular">
      {step}
    </span>
    <div className="min-w-0">
      <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-text-primary">
        <span className="text-text-tertiary">{icon}</span>
        {title}
      </h3>
      <p className="mt-0.5 text-[11.5px] leading-4 text-text-tertiary">{hint}</p>
    </div>
  </div>
)

export default function Signup() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [plan, setPlan] = useState<SubscriptionPlan>('Professional')
  const [form, setForm] = useState({
    organizationName: '',
    organizationEmail: '',
    country: 'India',
    city: '',
    branchCount: '1',
    employeeCount: '',
    adminName: '',
    adminEmail: '',
    password: '',
    confirm: '',
  })

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    const result = await register({
      organizationName: form.organizationName,
      organizationEmail: form.organizationEmail,
      branchCount: Number(form.branchCount) || 1,
      employeeCount: Number(form.employeeCount) || 1,
      country: form.country,
      city: form.city,
      adminName: form.adminName,
      adminEmail: form.adminEmail,
      password: form.password,
      plan,
    })
    setLoading(false)
    if (!result.ok) {
      setError(result.error ?? 'Unable to create the organisation.')
      return
    }
    const home = '/dashboard'
    navigate(home, { replace: true })
  }

  return (
    <AuthShell
      wide
      eyebrow="Register organisation"
      title="Create your hospital workspace"
      description="The first account becomes the Organisation Super Admin and can invite the rest of the team."
      headline="One account, every department."
      body="Set up the organisation once, then bring branches, administrators, doctors and staff into a single operating picture."
      footer={
        <p className="text-[12.5px] text-text-secondary">
          Already have a workspace?{' '}
          <Link to="/login" className="font-medium text-primary transition-colors hover:text-primary-hover">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} className="space-y-6">
        <section>
          <SectionHeading
            step="01"
            icon={<Building2 size={13} />}
            title="Organisation"
            hint="Where your care teams work and how to reach the workspace."
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                name="organizationName"
                label="Hospital or organisation name"
                placeholder="Ayush Seva Multispeciality Hospital"
                icon={<Hospital size={15} />}
                inputSize="lg"
                value={form.organizationName}
                onChange={set('organizationName')}
                required
              />
            </div>
            <Input
              type="email"
              name="organizationEmail"
              label="Organisation email"
              placeholder="admin@yourhospital.org"
              icon={<Mail size={15} />}
              inputSize="lg"
              value={form.organizationEmail}
              onChange={set('organizationEmail')}
              required
            />
            <Input
              type="number"
              name="branchCount"
              min={1}
              label="Number of branches"
              placeholder="1"
              inputSize="lg"
              value={form.branchCount}
              onChange={set('branchCount')}
              required
            />
            <Input
              type="number"
              name="employeeCount"
              min={1}
              label="Number of employees"
              placeholder="150"
              inputSize="lg"
              value={form.employeeCount}
              onChange={set('employeeCount')}
              required
            />
            <Input
              name="country"
              label="Country"
              placeholder="India"
              icon={<MapPin size={15} />}
              inputSize="lg"
              value={form.country}
              onChange={set('country')}
              required
            />
            <Input
              name="city"
              label="City"
              placeholder="Bengaluru"
              icon={<MapPin size={15} />}
              inputSize="lg"
              value={form.city}
              onChange={set('city')}
              required
            />
          </div>
        </section>

        <section className="border-t border-border pt-6">
          <SectionHeading
            step="02"
            icon={<Layers3 size={13} />}
            title="Subscription plan"
            hint="Choose the shape of your rollout. You can change this later."
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {plans.map((option) => {
              const active = plan === option.id
              const Icon = option.icon
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPlan(option.id)}
                  aria-pressed={active}
                  className={`group relative overflow-hidden rounded-xl border p-3.5 text-left transition-all duration-150 ${
                    active
                      ? 'border-primary-border bg-primary-light shadow-[0_10px_26px_-20px_rgba(37,99,235,0.8)]'
                      : 'border-border bg-white hover:border-border-strong hover:bg-bg-secondary/40'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
                      active ? 'border-primary-border bg-white text-primary' : 'border-border bg-bg-secondary text-text-tertiary'
                    }`}
                  >
                    <Icon size={14} />
                  </span>
                  {active && (
                    <span className="absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white">
                      <Check size={10} strokeWidth={3} />
                    </span>
                  )}
                  <span
                    className={`mt-2.5 block font-display text-[12.5px] font-semibold ${
                      active ? 'text-primary' : 'text-text-primary'
                    }`}
                  >
                    {option.id}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-4 text-text-secondary">{option.description}</span>
                  <span className="mt-0.5 block text-[10.5px] leading-4 text-text-tertiary">{option.detail}</span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="border-t border-border pt-6">
          <SectionHeading
            step="03"
            icon={<User size={13} />}
            title="Super Admin account"
            hint="This person owns organisation-wide settings and access."
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              name="adminName"
              label="Full name"
              placeholder="Dr. Jane Doe"
              icon={<User size={15} />}
              inputSize="lg"
              value={form.adminName}
              onChange={set('adminName')}
              autoComplete="name"
              required
            />
            <Input
              type="email"
              name="adminEmail"
              label="Admin email"
              placeholder="you@yourhospital.org"
              icon={<Mail size={15} />}
              inputSize="lg"
              value={form.adminEmail}
              onChange={set('adminEmail')}
              autoComplete="email"
              required
            />
            <Input
              type="password"
              name="password"
              label="Password"
              placeholder="At least 8 characters"
              icon={<Lock size={15} />}
              inputSize="lg"
              value={form.password}
              onChange={set('password')}
              autoComplete="new-password"
              hint="Use at least 8 characters with a letter and a number."
              required
            />
            <Input
              type="password"
              name="confirm"
              label="Confirm password"
              placeholder="Re-enter your password"
              icon={<Lock size={15} />}
              inputSize="lg"
              value={form.confirm}
              onChange={set('confirm')}
              autoComplete="new-password"
              required
            />
          </div>
        </section>

        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-error/15 bg-[#fef3f2] px-3 py-2 text-[12px] leading-5 text-[#b42318]"
          >
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        <div className="space-y-3">
          <Button
            type="submit"
            size="xl"
            className="group w-full shadow-[0_14px_30px_-16px_rgba(37,99,235,0.75)]"
            loading={loading}
          >
            {loading ? 'Creating workspace' : 'Create organisation & sign in'}
            {!loading && <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />}
          </Button>
          <p className="text-center text-[10.5px] leading-4 text-text-tertiary">
            By continuing you agree to the workspace usage policy. The first account is granted full organisation access.
          </p>
        </div>
      </form>
    </AuthShell>
  )
}
