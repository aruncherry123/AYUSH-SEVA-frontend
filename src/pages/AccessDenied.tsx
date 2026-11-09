import { Link } from 'react-router-dom'
import { ShieldX, ArrowLeft, LogOut } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { useStore } from '../state/StoreContext'
import { homePathFor } from '../utils/permissions'
import { Button } from '../components/ui/button'

export default function AccessDenied() {
  const { user, signOut } = useAuth()
  const { db } = useStore()
  const home = homePathFor(db, user)

  return (
    <div className="mx-auto flex min-h-[62vh] max-w-md flex-col items-center justify-center text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-bg-secondary text-text-tertiary">
        <ShieldX size={22} />
      </span>
      <p className="mt-5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">
        Restricted area
      </p>
      <h1 className="mt-2 font-display text-[22px] font-semibold tracking-[-0.02em] text-text-primary">
        You do not have access to this page
      </h1>
      <p className="mt-2 text-[13px] leading-5 text-text-secondary">
        Your role ({user?.role ?? 'Guest'}) does not include this permission. Ask your organisation
        administrator if you need it, or return to a page your role can open.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Link to={home}>
          <Button size="sm">
            <ArrowLeft size={14} /> Go to my workspace
          </Button>
        </Link>
        <Button variant="outline" size="sm" onClick={signOut}>
          <LogOut size={14} /> Switch account
        </Button>
      </div>
    </div>
  )
}
