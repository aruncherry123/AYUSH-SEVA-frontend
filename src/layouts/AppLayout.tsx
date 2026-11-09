import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Sidebar } from '../components/layout/Sidebar'
import { Topbar } from '../components/layout/Topbar'
import { bottomItems, mobilePrimary, navGroups, type NavItem } from '../components/layout/navConfig'
import { Modal } from '../components/ui/modal'
import { useAuth } from '../state/AuthContext'

export default function AppLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()
  const { can } = useAuth()

  const allowed = useMemo(() => {
    const keep = (item: NavItem) => !item.permission || can(item.permission)
    return {
      primary: mobilePrimary.filter(keep),
      groups: navGroups
        .map((group) => ({ ...group, items: group.items.filter(keep) }))
        .filter((group) => group.items.length > 0),
      bottom: bottomItems.filter(keep),
    }
  }, [can])

  const allSecondaryLinks = useMemo(
    () => [
      ...allowed.groups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label }))),
      ...allowed.bottom.map((i) => ({ ...i, group: 'More' })),
    ],
    [allowed],
  )

  return (
    <div className="flex h-screen bg-white">
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setIsMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto w-full max-w-[1600px] px-5 pb-28 pt-6 sm:px-7 lg:px-10 lg:pb-12 lg:pt-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-border bg-white/95 backdrop-blur lg:hidden">
        {allowed.primary.map((item) => {
          const Icon = item.icon
          const active = location.pathname === item.path
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`relative flex flex-1 flex-col items-center gap-1 pb-2 pt-2.5 text-[10.5px] font-medium transition-colors ${
                active ? 'text-primary' : 'text-text-secondary'
              }`}
            >
              {active && <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-primary" aria-hidden="true" />}
              <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
              {item.label}
            </NavLink>
          )
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 pb-2 pt-2.5 text-[10.5px] font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          <Menu size={19} strokeWidth={1.8} />
          More
        </button>
      </nav>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="All modules" size="md">
        <div className="-mt-1 space-y-6">
          {allowed.groups.map((group) => (
            <div key={group.label}>
              <p className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
                {group.label}
              </p>
              <div className="grid grid-cols-2 gap-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMoreOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[13px] transition-colors ${
                          isActive
                            ? 'bg-primary-light font-medium text-primary'
                            : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                        }`
                      }
                    >
                      <Icon size={16} className="shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
          <div>
            <p className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">More</p>
            <div className="grid grid-cols-2 gap-1">
              {allowed.bottom.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[13px] transition-colors ${
                        isActive
                          ? 'bg-primary-light font-medium text-primary'
                          : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                      }`
                    }
                  >
                    <Icon size={16} className="shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          </div>
        </div>
        <p className="sr-only">{allSecondaryLinks.length} modules</p>
      </Modal>
    </div>
  )
}
