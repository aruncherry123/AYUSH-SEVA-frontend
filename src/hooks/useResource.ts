import { useStore } from '../state/StoreContext'
import type { Database, StoreKey } from '../types'

/**
 * Typed CRUD binding for a single collection in the mock data store.
 * Keeps UI components decoupled from the store implementation so a real
 * API-backed service can be swapped in later without touching the pages.
 */
export function useResource<K extends StoreKey>(key: K) {
  const { db, create, update, remove } = useStore()
  type T = Database[K][number]

  return {
    items: db[key] as T[],
    create: (item: Partial<T>) => create(key, item as Omit<T, 'id'>),
    update: (id: string, patch: Partial<T>) => update(key, id, patch),
    remove: (id: string) => remove(key, id),
  }
}
