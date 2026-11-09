import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, Lock } from 'lucide-react'
import { AuthShell } from '../components/auth/AuthShell'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useAuth } from '../state/AuthContext'
import { useStore } from '../state/StoreContext'
import { useToast } from '../state/ToastContext'
import { homePathFor } from '../utils/permissions'

export default function ChangePassword() {
  const navigate = useNavigate()
  const { db } = useStore()
  const { user, changePassword, signOut } = useAuth()
  const toast = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const forced = Boolean(user?.mustChangePassword)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (next !== confirm) {
      setError('New passwords do not match.')
      return
    }
    setLoading(true)
    const result = await changePassword(current, next)
    setLoading(false)
    if (!result.ok) {
      setError(result.error ?? 'Unable to change your password.')
      return
    }
    toast.success('Password changed', 'Use your new password the next time you sign in.')
    navigate(homePathFor(db, user), { replace: true })
  }

  return (
    <AuthShell
      eyebrow="Account security"
      title={forced ? 'Set a new password' : 'Change your password'}
      description={
        forced
          ? 'Your temporary credentials must be replaced before you continue into the workspace.'
          : 'Update the password used to sign in to Ayush Seva.'
      }
      headline="Security that follows the role."
      body="Passwords are salted and hashed before they are stored — never kept as plain text — and access is re-checked on every route."
      footer={
        <button
          type="button"
          onClick={() => {
            signOut()
            navigate('/login')
          }}
          className="text-[12.5px] font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          Sign out and use another account
        </button>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-lg border border-border bg-surface-muted px-3.5 py-3">
          <p className="flex items-center gap-2 text-[12.5px] font-medium text-text-primary">
            <KeyRound size={14} className="text-primary" /> {user?.name}
          </p>
          <p className="mt-1 text-[11.5px] text-text-secondary">
            {user?.email} · {user?.role}
          </p>
        </div>

        <Input
          type="password"
          name="currentPassword"
          label={forced ? 'Temporary password' : 'Current password'}
          placeholder="Enter your current password"
          icon={<Lock size={15} />}
          inputSize="lg"
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
          autoComplete="current-password"
          required
        />
        <Input
          type="password"
          name="newPassword"
          label="New password"
          placeholder="At least 8 characters"
          icon={<Lock size={15} />}
          inputSize="lg"
          value={next}
          onChange={(event) => setNext(event.target.value)}
          hint="Use at least 8 characters with a letter and a number."
          autoComplete="new-password"
          required
        />
        <Input
          type="password"
          name="confirmPassword"
          label="Confirm new password"
          placeholder="Re-enter the new password"
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
          Save new password
        </Button>
      </form>
    </AuthShell>
  )
}
