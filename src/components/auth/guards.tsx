import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../state/AuthContext'
import AccessDenied from '../../pages/AccessDenied'
import { LoadingState } from '../ui/states'

/** Blocks unauthenticated visitors and forces first-time password changes. */
export function RequireAuth({
  children,
  allowPasswordChange = false,
}: {
  children: ReactNode
  allowPasswordChange?: boolean
}) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  if (user.mustChangePassword && !allowPasswordChange) {
    return <Navigate to="/change-password" replace />
  }
  return <>{children}</>
}

/** Renders in place of the page so the workspace shell stays visible. */
export function RequirePermission({
  permission,
  children,
}: {
  permission: string
  children: ReactNode
}) {
  const { can } = useAuth()
  if (!can(permission)) return <AccessDenied />
  return <>{children}</>
}

export function AuthFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingState label="Opening secure workspace…" />
    </div>
  )
}
