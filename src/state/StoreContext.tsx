import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Database, StoreKey } from '../types'
import { seedDatabase } from '../data/mockData'

const STORAGE_KEY = 'Ayush Seva.db.v2'
const LEGACY_KEY = 'Ayush Seva.db.v1'

type ItemOf<K extends StoreKey> = Database[K][number]

interface StoreValue {
  db: Database
  create: <K extends StoreKey>(key: K, item: Omit<ItemOf<K>, 'id'>) => ItemOf<K>
  update: <K extends StoreKey>(key: K, id: string, patch: Partial<ItemOf<K>>) => void
  remove: <K extends StoreKey>(key: K, id: string) => void
  reset: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

const uid = (key: string) =>
  `${key.replace(/s$/, '').slice(0, 4)}-${Math.random().toString(36).slice(2, 8)}`

function loadDatabase(): Database {
  if (typeof window === 'undefined') return seedDatabase
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_KEY)
    if (!raw) return seedDatabase
    const parsed = JSON.parse(raw) as Partial<Database>

    // Auth collections must come from the seeded accounts: legacy records have
    // no password hashes, organisation or branch scope.
    const usersValid =
      Array.isArray(parsed.users) &&
      parsed.users.length > 0 &&
      parsed.users.every((user) => user.organizationId && user.passwordHash && user.passwordSalt)
    const users = usersValid ? parsed.users! : seedDatabase.users
    const userIds = new Set(users.map((user) => user.id))

    const rolesValid =
      Array.isArray(parsed.roles) &&
      ['Super Admin', 'Branch Admin', 'Doctor', 'Staff'].every((name) =>
        parsed.roles!.some((role) => role.name === name),
      )
    const roles = rolesValid ? parsed.roles! : seedDatabase.roles

    const attendanceValid =
      Array.isArray(parsed.attendance) &&
      parsed.attendance.length > 0 &&
      parsed.attendance.every((row) => row.organizationId && userIds.has(row.userId))
    const leavesValid =
      Array.isArray(parsed.leaves) &&
      parsed.leaves.length > 0 &&
      parsed.leaves.every((row) => row.organizationId && userIds.has(row.userId))
    const tasksValid =
      Array.isArray(parsed.tasks) &&
      parsed.tasks.length > 0 &&
      parsed.tasks.every((row) => row.organizationId)

    // Merge with seed so newly added collections are always present, while
    // preserving user-created records in the other modules.
    return {
      ...seedDatabase,
      ...parsed,
      organizations: parsed.organizations?.length ? parsed.organizations : seedDatabase.organizations,
      branches: parsed.branches?.length ? parsed.branches : seedDatabase.branches,
      users,
      roles,
      attendance: attendanceValid ? parsed.attendance! : seedDatabase.attendance,
      leaves: leavesValid ? parsed.leaves! : seedDatabase.leaves,
      tasks: tasksValid ? parsed.tasks! : seedDatabase.tasks,
    } as Database
  } catch {
    return seedDatabase
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database>(loadDatabase)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
    } catch {
      // Ignore quota / privacy errors.
    }
  }, [db])

  const create = useCallback(<K extends StoreKey>(key: K, item: Omit<ItemOf<K>, 'id'>) => {
    const record = { ...item, id: uid(key) } as ItemOf<K>
    setDb((prev) => ({ ...prev, [key]: [record, ...prev[key]] }) as Database)
    return record
  }, [])

  const update = useCallback(
    <K extends StoreKey>(key: K, id: string, patch: Partial<ItemOf<K>>) => {
      setDb((prev) => ({
        ...prev,
        [key]: (prev[key] as ItemOf<K>[]).map((row) =>
          row.id === id ? { ...row, ...patch } : row,
        ),
      }) as Database)
    },
    [],
  )

  const remove = useCallback(<K extends StoreKey>(key: K, id: string) => {
    setDb((prev) => ({
      ...prev,
      [key]: (prev[key] as ItemOf<K>[]).filter((row) => row.id !== id),
    }) as Database)
  }, [])

  const reset = useCallback(() => {
    setDb(seedDatabase)
  }, [])

  const value = useMemo<StoreValue>(
    () => ({ db, create, update, remove, reset }),
    [db, create, update, remove, reset],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within a StoreProvider')
  return ctx
}

export function useCollection<K extends StoreKey>(key: K): Database[K] {
  const { db } = useStore()
  return db[key]
}
