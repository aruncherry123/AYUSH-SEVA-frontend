import { useSearchParams } from 'react-router-dom'

/**
 * Keeps a hub page's active section in the URL so tabs can be linked to and
 * survive a refresh, without adding a route per section.
 */
export function useTabParam<T extends string>(tabs: readonly T[], fallback: T) {
  const [params, setParams] = useSearchParams()
  const requested = params.get('tab') as T | null
  const active = requested && tabs.includes(requested) ? requested : fallback

  const setActive = (id: string) => {
    if (!tabs.includes(id as T)) return
    const next = new URLSearchParams(params)
    if (id === fallback) next.delete('tab')
    else next.set('tab', id)
    setParams(next, { replace: true })
  }

  return [active, setActive] as const
}
