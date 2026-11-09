import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Lock, Mail, ShieldCheck } from 'lucide-react'
import { AuthShell } from '../components/auth/AuthShell'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useAuth } from '../state/AuthContext'
import { useStore } from '../state/StoreContext'

export default function Activate() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { db } = useStore()
  const { activate } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const invite = useMemo(
    () => db.users.find((user) => user.activationToken === token && user.status === 'Invited') ?? null,
    [db.users, token],
  )
  const organization = db.organizations.find((item) => item.id === invite?.organizationId)
  const branch = db.branches.find((item) => item.id === invite?.branchId)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!token) return
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    const result = await activate(token, password)
    setLoading(false)
    if (!result.ok) {
      setError(result.error ?? 'Unable to activate this account.')
      return
    }
    navigate('/dashboard', { replace: true })
  }

  return (
    <AuthShell
      eyebrow="Account activation"
      title={invite ? 'Set your password' : 'Invitation not found'}
      description={
        invite
          ? 'Choose a password to activate your Ayush Seva account and open the workspace.'
          : 'This invitation link is invalid or has already been used.'
      }
      headline="A single sign-in for every role."
      body="Once activated, your permissions decide which parts of the workspace open for you — from clinical records to attendance and assigned tasks."
      footer={
        <p className="text-[12.5px] text-text-secondary">
          Already activated?{' '}
          <Link to="/login" className="font-medium text-primary transition-colors hover:text-primary-hover">
            Sign in
          </Link>
        </p>
      }
    >
      {invite ? (
        <form onSubmit={submit} className="space-y-4">
          <div className="rounded-lg border border-border bg-surface-muted px-3.5 py-3">
            <p className="flex items-center gap-2 text-[12.5px] font-medium text-text-primary">
              <ShieldCheck size={14} className="text-primary" /> {invite.name}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-text-secondary">
              <Mail size={12} /> {invite.email}
            </p>
            <p className="mt-1 text-[11.5px] text-text-tertiary">
              {invite.designation} · {branch?.name ?? 'Head Office'} · {organization?.name ?? 'Organisation'}
            </p>
          </div>

          <Input
            type="password"
            name="newPassword"
            label="New password"
            placeholder="At least 8 characters"
            icon={<Lock size={15} />}
            inputSize="lg"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
          <Input
            type="password"
            name="confirmPassword"
            label="Confirm password"
            placeholder="Re-enter your password"
            icon={<Lock size={15} />}
            inputSize="lg"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="new-password"
            required
          />

          {error && (
            <p role="alert" className="rounded-lg bg-[#fef3f2] px-3 py-2 text-[12px] leading-5 text-[#b42318]">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" loading={loading} size="xl">
            Activate account
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="rounded-lg border border-border bg-bg-secondary px-3.5 py-3 text-[12.5px] leading-5 text-text-secondary">
            Ask your organisation administrator to send a fresh invitation from Users &amp; Access.
          </p>
          <Link to="/login" className="block">
            <Button variant="outline" className="w-full">
              Back to sign in
            </Button>
          </Link>
        </div>
      )}
    </AuthShell>
  )
}
