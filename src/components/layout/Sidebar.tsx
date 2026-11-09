import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronsLeft, ChevronsRight, X } from 'lucide-react'
import { bottomItems, navGroups, topItems, type NavItem } from './navConfig'
import { Logo, LogoMark } from '../brand/Logo'
import { useAuth } from '../../state/AuthContext'

interface SidebarProps {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
}

export const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }: SidebarProps) => {
  const location = useLocation()
  const { can } = useAuth()
  const [openGroups, setOpenGroups] = useState<string[]>([])

  const allowed = useMemo(() => {
    const keep = (item: NavItem) => !item.permission || can(item.permission)
    return {
      top: topItems.filter(keep),
      groups: navGroups
        .map((group) => ({ ...group, items: group.items.filter(keep) }))
        .filter((group) => group.items.length > 0),
      bottom: bottomItems.filter(keep),
    }
  }, [can])

  // Keep the section that owns the current route expanded.
  useEffect(() => {
    const activeGroup = allowed.groups.find((g) => g.items.some((i) => i.path === location.pathname))
    if (activeGroup) {
      setOpenGroups((prev) => (prev.includes(activeGroup.label) ? prev : [...prev, activeGroup.label]))
    }
  }, [allowed.groups, location.pathname])

  const toggleGroup = (label: string) =>
    setOpenGroups((prev) => (prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]))

  const renderItem = (item: NavItem, indented = false) => {
    const Icon = item.icon
    return (
      <NavLink
        key={item.path}
        to={item.path}
        title={isCollapsed ? item.label : undefined}
        onClick={() => setIsMobileOpen(false)}
        className={({ isActive }) =>
          `group relative flex h-10 items-center gap-3 rounded-lg text-[13px] transition-colors ${
            indented && !isCollapsed ? 'pl-9 pr-3' : 'px-3'
          } ${isCollapsed ? 'justify-center px-0' : ''} ${
            isActive
              ? 'bg-sidebar-active-soft font-semibold text-white'
              : 'font-medium text-sidebar-text hover:bg-white/[0.05] hover:text-white'
          }`
        }
      >
        {({ isActive }) => (
          <>
            {isActive && !isCollapsed && (
              <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" aria-hidden="true" />
            )}
            <Icon
              size={16}
              className={`shrink-0 transition-colors ${isActive ? 'text-blue-300' : 'text-sidebar-text/70 group-hover:text-sidebar-text'}`}
            />
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </>
        )}
      </NavLink>
    )
  }

  return (
    <>
      {isMobileOpen && (
        <div
          className="animate-fade-in fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`z-50 flex-col overflow-hidden rounded-r-2xl bg-sidebar text-sidebar-text transition-[width] duration-200 ${
          isCollapsed ? 'lg:w-[76px]' : 'lg:w-[276px]'
        } ${isMobileOpen ? 'fixed inset-y-0 left-0 flex w-[284px]' : 'hidden lg:flex'}`}
      >
        <div className={`flex h-16 items-center border-b border-sidebar-border px-4 ${isCollapsed ? 'lg:justify-center lg:px-2' : 'justify-between'}`}>
          <div className="flex min-w-0 items-center gap-3">
            {isCollapsed ? <LogoMark size={32} className="shrink-0" /> : <Logo tone="light" size={32} />}
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="rounded-md p-1.5 text-sidebar-text hover:bg-white/10 lg:hidden"
            aria-label="Close navigation"
          >
            <X size={17} />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto scrollbar-dark px-3 py-5">
          {allowed.top.map((item) => renderItem(item))}

          {!isCollapsed && <div className="mx-1 my-4 h-px bg-sidebar-border" aria-hidden="true" />}

          {!isCollapsed &&
            allowed.groups.map((group) => {
              const isOpen = openGroups.includes(group.label)
              const groupActive = group.items.some((i) => i.path === location.pathname)
              return (
                <div key={group.label} className="pt-2">
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className={`flex h-8 w-full items-center justify-between rounded-md px-3 text-[10.5px] font-semibold uppercase tracking-[0.09em] transition-colors ${
                      groupActive ? 'text-sidebar-text' : 'text-sidebar-text/55'
                    } hover:text-white`}
                    aria-expanded={isOpen}
                  >
                    <span className="flex items-center gap-2">
                      {group.label}
                      {groupActive && !isOpen && <span className="h-1 w-1 rounded-full bg-primary" aria-hidden="true" />}
                    </span>
                    <ChevronDown size={13} className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                  </button>
                  {isOpen && <div className="mt-1 space-y-1.5">{group.items.map((item) => renderItem(item, true))}</div>}
                </div>
              )
            })}

          {isCollapsed && (
            <div className="space-y-2">
              {allowed.groups.map((group) => (
                <div key={group.label} className="border-t border-sidebar-border pt-2">
                  <div className="space-y-1.5">{group.items.map((item) => renderItem(item))}</div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4">
            {!isCollapsed && <div className="mx-1 mb-4 h-px bg-sidebar-border" aria-hidden="true" />}
            <div className="space-y-1.5">{allowed.bottom.map((item) => renderItem(item))}</div>
          </div>
        </nav>

        <div className="hidden border-t border-sidebar-border p-3 lg:block">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`flex h-9 w-full items-center gap-3 rounded-lg px-3 text-[12.5px] text-sidebar-text transition-colors hover:bg-white/[0.05] hover:text-white ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
            {!isCollapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
