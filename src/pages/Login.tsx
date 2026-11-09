import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from 'lucide-react'
import { AuthShell } from '../components/auth/AuthShell'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useAuth } from '../state/AuthContext'
import { useStore } from '../state/StoreContext'
import { homePathFor } from '../utils/permissions'

const demoAccounts = [
  { role: 'Super Admin', email: 'admin@ayushseva.org', icon: ShieldCheck },
  { role: 'Branch Admin', email: 'robert.wilson@ayushseva.org', icon: Building2 },
  { role: 'Doctor', email: 'sarah.johnson@ayushseva.org', icon: Stethoscope },
  { role: 'Staff', email: 'emily.davis@ayushseva.org', icon: UserRound },
]

export default function Login() {
  const navigate = useNavigate()
  const { db } = useStore()
  const { signIn } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('admin@ayushseva.org')
  const [password, setPassword] = useState('password')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    const result = await signIn(email, password)
    setLoading(false)
    if (!result.ok) {
      setError(result.error ?? 'Unable to sign in.')
      return
    }
    navigate(homePathFor(db, result.user ?? null), { replace: true })
  }

  return (
    <AuthShell
      eyebrow="Sign in"
      title="Welcome back"
      description="Use your organisation email and password to open the workspace."
      headline="The operating system for everyday care."
      body="Patients, staffing, pharmacy and facilities move together — so your team can spend less time coordinating and more time caring."
      footer={
        <p className="text-[12.5px] text-text-secondary">
          Setting up a new hospital?{' '}
          <Link to="/signup" className="font-medium text-primary transition-colors hover:text-primary-hover">
            Register your organisation
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Input
          type="email"
          name="email"
          label="Email address"
          placeholder="you@ayushseva.org"
          icon={<Mail size={15} />}
          inputSize="lg"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />

        <Input
          type={showPassword ? 'text' : 'password'}
          name="password"
          label="Password"
          placeholder="Enter your password"
          icon={<Lock size={15} />}
          inputSize="lg"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
          required
        />

        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-error/15 bg-[#fef3f2] px-3 py-2 text-[12px] leading-5 text-[#b42318]"
          >
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        <Button
          type="submit"
          size="xl"
          className="group mt-1 w-full shadow-[0_14px_30px_-16px_rgba(37,99,235,0.75)]"
          loading={loading}
        >
          {loading ? 'Signing in' : 'Sign in'}
          {!loading && <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />}
        </Button>

        <p className="flex items-center justify-center gap-1.5 text-[10.5px] leading-4 text-text-tertiary">
          <ShieldCheck size={12} className="text-mint-ink" />
          Role-aware access · every action is scoped and audited
        </p>
      </form>

      <div className="mt-5 rounded-xl border border-border bg-bg-secondary/60 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-text-tertiary">Demo access</p>
          <span className="rounded-full border border-border bg-white px-2 py-0.5 text-[9.5px] font-medium text-text-tertiary">
            password
          </span>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-1.5">
          {demoAccounts.map((account) => {
            const Icon = account.icon
            const active = email === account.email
            return (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setEmail(account.email)
                  setPassword('password')
                  setError('')
                }}
                aria-pressed={active}
                className={`flex min-w-0 items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-all duration-150 ${
                  active
                    ? 'border-primary-border bg-primary-light shadow-[0_6px_16px_-12px_rgba(37,99,235,0.7)]'
                    : 'border-border bg-white hover:border-primary-border hover:bg-primary-light/40'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                    active ? 'border-primary-border bg-white text-primary' : 'border-border bg-bg-secondary text-text-tertiary'
                  }`}
                >
                  <Icon size={12} />
                </span>
                <span className="min-w-0">
                  <span className={`block truncate text-[11.5px] font-semibold leading-tight ${active ? 'text-primary' : 'text-text-primary'}`}>
                    {account.role}
                  </span>
                  <span className="mt-0.5 block truncate text-[9.5px] leading-tight text-text-tertiary">
                    {account.email.split('@')[0]}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-[10.5px] leading-4 text-text-tertiary">
          Tap a role to fill its credentials. Every demo account uses the password{' '}
          <span className="font-medium text-text-secondary">password</span>.
        </p>
      </div>
    </AuthShell>
  )
}
