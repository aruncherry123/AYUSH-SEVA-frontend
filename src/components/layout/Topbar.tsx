import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Search, Bell, ChevronDown, Menu, Building2, LogOut, Settings as SettingsIcon, Check, CornerDownLeft, KeyRound } from 'lucide-react'
import { useStore } from '../../state/StoreContext'
import { useAuth } from '../../state/AuthContext'
import { useToast } from '../../state/ToastContext'
import { breadcrumbsFor } from './navConfig'
import { Avatar } from '../ui/avatar'

interface TopbarProps {
  onMenuClick: () => void
}

interface SearchResult {
  id: string
  label: string
  sub: string
  path: string
  kind: string
}

export const Topbar = ({ onMenuClick }: TopbarProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { db, update } = useStore()
  const { user, signOut } = useAuth()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileSearch, setMobileSearch] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const organization = db.organizations.find((item) => item.id === user?.organizationId)
  const branch = db.branches.find((item) => item.id === user?.branchId)

  const unread = db.notifications.filter((n) => !n.read).length
  const crumbs = useMemo(() => {
    const list = breadcrumbsFor(location.pathname)
    // On patient detail pages, show the patient's name instead of the raw id.
    const m = location.pathname.match(/^\/patients\/(.+)$/)
    if (m) {
      const patient = db.patients.find((p) => p.id === m[1])
      if (patient) return [{ ...list[0], label: 'Patients' }, { label: patient.name, path: location.pathname }]
    }
    return list
  }, [location.pathname, db.patients])

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const out: SearchResult[] = []
    db.patients.forEach((p) => {
      if (p.name.toLowerCase().includes(q) || p.mrn.toLowerCase().includes(q))
        out.push({ id: p.id, label: p.name, sub: `${p.mrn} • Patient`, path: `/patients/${p.id}`, kind: 'Patient' })
    })
    db.doctors.forEach((d) => {
      if (d.name.toLowerCase().includes(q) || d.specialization.toLowerCase().includes(q))
        out.push({ id: d.id, label: d.name, sub: `${d.specialization} • ${d.department}`, path: '/people/directory', kind: 'Doctor' })
    })
    db.employees.forEach((e) => {
      if (e.name.toLowerCase().includes(q) || e.designation.toLowerCase().includes(q))
        out.push({ id: e.id, label: e.name, sub: `${e.designation} • ${e.department}`, path: '/people/directory?tab=employees', kind: 'Employee' })
    })
    db.medicines.forEach((m) => {
      if (m.name.toLowerCase().includes(q) || m.genericName.toLowerCase().includes(q))
        out.push({ id: m.id, label: m.name, sub: `${m.category} • Pharmacy`, path: '/inventory/stock?tab=catalogue', kind: 'Medicine' })
    })
    db.appointments.forEach((a) => {
      if (a.patientName.toLowerCase().includes(q) || a.doctorName.toLowerCase().includes(q))
        out.push({ id: a.id, label: a.patientName, sub: `${a.doctorName} • ${a.time}`, path: '/appointments', kind: 'Appointment' })
    })
    return out.slice(0, 8)
  }, [query, db])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
        setNotifOpen(false)
        setProfileOpen(false)
        setMobileSearch(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
        setSearchOpen(true)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setNotifOpen(false)
        setProfileOpen(false)
        searchRef.current?.blur()
      }
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const goTo = (path: string) => {
    navigate(path)
    setSearchOpen(false)
    setMobileSearch(false)
    setQuery('')
  }

  return (
    <header
      ref={containerRef}
      className="z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-white px-4 lg:px-6"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          onClick={onMenuClick}
          className="-ml-1 rounded-lg p-2 text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={19} />
        </button>

        <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-[13px] md:flex">
          {crumbs.map((c, i) => (
            <span key={c.path} className="flex min-w-0 items-center gap-1.5">
              {i > 0 && <span className="text-border-strong">/</span>}
              {i === crumbs.length - 1 ? (
                <span className="truncate font-medium text-text-primary">{c.label}</span>
              ) : (
                <Link to={c.path} className="truncate text-text-secondary transition-colors hover:text-text-primary">
                  {c.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {/* Global search */}
        <div className="relative hidden sm:block">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary"
            size={15}
          />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSearchOpen(true)
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search"
            className="h-9 w-44 rounded-lg border border-transparent bg-bg-secondary pl-8 pr-14 text-[13px] text-text-primary outline-none transition-all placeholder:text-text-tertiary focus:w-64 focus:border-border-strong focus:bg-white lg:w-56 lg:focus:w-72"
            aria-label="Global search"
          />
          {!query && (
            <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-border bg-white px-1.5 py-0.5 text-[10px] font-medium text-text-tertiary lg:flex">
              ⌘K
            </kbd>
          )}
          {searchOpen && query.trim() && (
            <div className="absolute left-0 right-0 top-full mt-2 animate-fade-in overflow-hidden rounded-xl border border-border bg-white shadow-lg">
              {results.length === 0 ? (
                <p className="px-4 py-4 text-[13px] text-text-secondary">No results for “{query}”.</p>
              ) : (
                <ul className="max-h-80 overflow-y-auto py-1 scrollbar-thin">
                  {results.map((r) => (
                    <li key={`${r.kind}-${r.id}`}>
                      <button
                        onClick={() => goTo(r.path)}
                        className="group flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-bg-secondary"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-text-primary">{r.label}</p>
                          <p className="truncate text-[11.5px] text-text-secondary">{r.sub}</p>
                        </div>
                        <span className="shrink-0 text-[10.5px] font-medium uppercase tracking-[0.06em] text-text-tertiary">
                          {r.kind}
                        </span>
                        <CornerDownLeft
                          size={12}
                          className="hidden shrink-0 text-text-tertiary group-hover:block"
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Facility context */}
        <div className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] text-text-primary xl:flex">
          <Building2 size={15} className="shrink-0 text-text-tertiary" />
          <span className="max-w-[180px] truncate">{branch?.name ?? 'Workspace'}</span>
          <span className="max-w-[160px] truncate text-[11.5px] text-text-tertiary">
            {organization?.name ?? ''}
          </span>
        </div>

        <span className="mx-1 hidden h-5 w-px bg-border xl:block" aria-hidden="true" />

        {/* Mobile search */}
        <button
          onClick={() => {
            setMobileSearch((v) => !v)
            setNotifOpen(false)
            setProfileOpen(false)
          }}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary sm:hidden"
          aria-label="Search"
          aria-expanded={mobileSearch}
        >
          <Search size={18} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((v) => !v)
              setProfileOpen(false)
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
            aria-label={`Notifications, ${unread} unread`}
            aria-expanded={notifOpen}
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 min-w-[15px] rounded-full bg-primary px-1 text-[9.5px] font-semibold leading-[15px] text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-[min(92vw,360px)] animate-fade-in overflow-hidden rounded-xl border border-border bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-[13px] font-semibold text-text-primary">Notifications</p>
                {unread > 0 && (
                  <button
                    onClick={() => {
                      db.notifications.filter((n) => !n.read).forEach((n) => update('notifications', n.id, { read: true }))
                      toast.success('All notifications marked as read')
                    }}
                    className="flex items-center gap-1 text-[11.5px] font-medium text-primary transition-colors hover:text-primary-hover"
                  >
                    <Check size={12} /> Mark all read
                  </button>
                )}
              </div>
              <ul className="max-h-80 overflow-y-auto scrollbar-thin">
                {db.notifications.slice(0, 6).map((n) => (
                  <li
                    key={n.id}
                    className={`group border-b border-border/70 px-4 py-3 transition-colors last:border-0 hover:bg-surface-muted ${
                      n.read ? '' : 'bg-primary-light/40'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] font-medium leading-5 text-text-primary">{n.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-4 text-text-secondary">{n.message}</p>
                        <p className="mt-1 text-[10.5px] text-text-tertiary">{n.timestamp}</p>
                      </div>
                      {!n.read && (
                        <button
                          onClick={() => update('notifications', n.id, { read: true })}
                          className="shrink-0 rounded p-1 text-text-tertiary opacity-0 transition-all hover:bg-white hover:text-primary group-hover:opacity-100"
                          aria-label="Mark as read"
                        >
                          <Check size={13} />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <Link
                to="/dashboard"
                onClick={() => setNotifOpen(false)}
                className="block border-t border-border py-2.5 text-center text-[12.5px] font-medium text-primary transition-colors hover:bg-bg-secondary"
              >
                Go to dashboard
              </Link>
            </div>
          )}
        </div>

        {/* Account */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen((v) => !v)
              setNotifOpen(false)
            }}
            className="flex items-center gap-2 rounded-lg p-1 pr-1.5 transition-colors hover:bg-bg-secondary"
            aria-label="Account menu"
            aria-expanded={profileOpen}
          >
            <Avatar name={user?.name ?? 'Signed out'} size="sm" />
            <span className="hidden flex-col items-start leading-tight md:flex">
              <span className="max-w-[150px] truncate text-[12.5px] font-medium text-text-primary">
                {user?.name ?? 'Signed out'}
              </span>
              <span className="text-[10.5px] text-text-secondary">{user?.role ?? ''}</span>
            </span>
            <ChevronDown size={14} className="hidden text-text-tertiary md:block" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 animate-fade-in overflow-hidden rounded-xl border border-border bg-white py-1 shadow-lg">
              <div className="border-b border-border px-4 py-3">
                <p className="truncate text-[13px] font-medium text-text-primary">{user?.name}</p>
                <p className="mt-0.5 truncate text-[11.5px] text-text-secondary">{user?.email}</p>
                <p className="mt-1 truncate text-[11px] text-text-tertiary">
                  {user?.designation} · {branch?.name}
                </p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    navigate('/settings')
                    setProfileOpen(false)
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
                >
                  <SettingsIcon size={15} className="text-text-tertiary" /> Account settings
                </button>
                <button
                  onClick={() => {
                    navigate('/change-password')
                    setProfileOpen(false)
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
                >
                  <KeyRound size={15} className="text-text-tertiary" /> Change password
                </button>
              </div>
              <div className="border-t border-border py-1">
                <button
                  onClick={() => {
                    signOut()
                    setProfileOpen(false)
                    navigate('/login')
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] text-error transition-colors hover:bg-[#fef3f2]"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {mobileSearch && (
        <div className="fixed inset-x-0 top-16 z-40 border-b border-border bg-white p-3 shadow-lg sm:hidden">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
              size={15}
            />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patients, staff, medicines…"
              className="h-10 w-full rounded-lg border border-border-strong bg-white pl-9 pr-3 text-[13px] text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-primary focus:ring-[3px] focus:ring-primary/15"
              aria-label="Search workspace"
            />
          </div>
          {query.trim() ? (
            results.length === 0 ? (
              <p className="px-1 py-3 text-[12.5px] text-text-secondary">No results for “{query}”.</p>
            ) : (
              <ul className="mt-2 max-h-[60vh] overflow-y-auto scrollbar-thin">
                {results.map((r) => (
                  <li key={`${r.kind}-${r.id}-mobile`}>
                    <button
                      onClick={() => goTo(r.path)}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-bg-secondary"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-text-primary">{r.label}</p>
                        <p className="truncate text-[11.5px] text-text-secondary">{r.sub}</p>
                      </div>
                      <span className="shrink-0 text-[10.5px] font-medium uppercase tracking-[0.06em] text-text-tertiary">
                        {r.kind}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <p className="mt-2.5 px-1 text-[11.5px] leading-5 text-text-tertiary">
              Search across patients, doctors, staff, medicines and appointments.
            </p>
          )}
        </div>
      )}
    </header>
  )
}
