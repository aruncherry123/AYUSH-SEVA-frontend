import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { SubscriptionPlan, User } from '../types'
import { useStore } from './StoreContext'
import { hasPermission } from '../utils/permissions'
import {
  clearSession,
  generateSalt,
  hashPassword,
  passwordProblem,
  readSession,
  verifyPassword,
  writeSession,
} from '../services/auth'

export interface RegistrationInput {
  organizationName: string
  organizationEmail: string
  branchCount: number
  employeeCount: number
  country: string
  city: string
  adminName: string
  adminEmail: string
  password: string
  plan: SubscriptionPlan
}

export interface SignInResult {
  ok: boolean
  error?: string
  user?: User
}

export interface RegisterResult {
  ok: boolean
  error?: string
  user?: User
}

interface AuthValue {
  user: User | null
  permissions: string[]
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<SignInResult>
  signOut: () => void
  register: (input: RegistrationInput) => Promise<RegisterResult>
  activate: (token: string, password: string) => Promise<RegisterResult>
  changePassword: (currentPassword: string, nextPassword: string) => Promise<{ ok: boolean; error?: string }>
  can: (permission: string) => boolean
}

const AuthContext = createContext<AuthValue | null>(null)

const normalise = (value: string) => value.trim().toLowerCase()
const initials = (name: string) =>
  name
    .replace(/^Dr\.\s*/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

export function AuthProvider({ children }: { children: ReactNode }) {
  const { db, create, update } = useStore()
  const [sessionUserId, setSessionUserId] = useState<string | null>(() => readSession())

  const user = useMemo(
    () => db.users.find((item) => item.id === sessionUserId) ?? null,
    [db.users, sessionUserId],
  )

  const permissions = useMemo(() => {
    if (!user) return []
    if (user.role === 'Super Admin') return ['all']
    if (user.permissions && user.permissions.length > 0) return user.permissions
    return db.roles.find((role) => role.name === user.role && role.status === 'Active')?.permissions ?? []
  }, [db.roles, user])

  const can = useCallback(
    (permission: string) => hasPermission(db, user, permission),
    [db, user],
  )

  const signIn = useCallback(
    async (email: string, password: string): Promise<SignInResult> => {
      const account = db.users.find((item) => normalise(item.email) === normalise(email))
      if (!account) return { ok: false, error: 'No account matches this email address.' }
      if (account.status === 'Invited') {
        return { ok: false, error: 'This account has not been activated yet. Use the invitation link sent to your email.' }
      }
      if (account.status !== 'Active') {
        return { ok: false, error: 'This account is not active. Contact your organisation administrator.' }
      }
      const valid = await verifyPassword(account, password)
      if (!valid) return { ok: false, error: 'Incorrect email or password.' }
      writeSession(account.id)
      setSessionUserId(account.id)
      update('users', account.id, { lastLoginAt: new Date().toISOString() })
      return { ok: true, user: account }
    },
    [db.users, update],
  )

  const signOut = useCallback(() => {
    clearSession()
    setSessionUserId(null)
  }, [])

  const register = useCallback(
    async (input: RegistrationInput): Promise<RegisterResult> => {
      if (db.users.some((item) => normalise(item.email) === normalise(input.adminEmail))) {
        return { ok: false, error: 'An account with this email already exists. Sign in instead.' }
      }
      if (db.organizations.some((item) => normalise(item.email) === normalise(input.organizationEmail))) {
        return { ok: false, error: 'This organisation email is already registered.' }
      }
      const problem = passwordProblem(input.password)
      if (problem) return { ok: false, error: problem }

      const salt = generateSalt()
      const passwordHash = await hashPassword(input.password, salt)
      const createdAt = new Date().toISOString()

      const organization = create('organizations', {
        name: input.organizationName.trim(),
        email: input.organizationEmail.trim(),
        country: input.country.trim(),
        city: input.city.trim(),
        plan: input.plan,
        branchCount: Math.max(1, input.branchCount),
        employeeCount: Math.max(1, input.employeeCount),
        status: 'Active',
        createdAt,
      })

      const branch = create('branches', {
        organizationId: organization.id,
        name: 'Head Office',
        code: `${input.organizationName.trim().slice(0, 3).toUpperCase()}-HQ`,
        city: input.city.trim(),
        country: input.country.trim(),
        address: input.city.trim(),
        phone: '',
        status: 'Active',
        createdAt,
      })

      const account = create('users', {
        organizationId: organization.id,
        branchId: branch.id,
        name: input.adminName.trim(),
        email: input.adminEmail.trim(),
        role: 'Super Admin',
        avatar: initials(input.adminName),
        department: 'Administration',
        designation: 'Organisation Super Admin',
        employeeId: 'EMP-0001',
        status: 'Active',
        passwordHash,
        passwordSalt: salt,
        permissions: ['all'],
        mustChangePassword: false,
        createdAt,
        lastLoginAt: createdAt,
      })

      writeSession(account.id)
      setSessionUserId(account.id)
      return { ok: true, user: account }
    },
    [create, db.organizations, db.users],
  )

  const activate = useCallback(
    async (token: string, password: string): Promise<RegisterResult> => {
      const account = db.users.find(
        (item) => item.activationToken === token && item.status === 'Invited',
      )
      if (!account) return { ok: false, error: 'This invitation is invalid or has already been used.' }
      const problem = passwordProblem(password)
      if (problem) return { ok: false, error: problem }

      const salt = generateSalt()
      const passwordHash = await hashPassword(password, salt)
      update('users', account.id, {
        passwordHash,
        passwordSalt: salt,
        status: 'Active',
        activationToken: undefined,
        mustChangePassword: false,
        lastLoginAt: new Date().toISOString(),
      })
      writeSession(account.id)
      setSessionUserId(account.id)
      return { ok: true, user: { ...account, status: 'Active' } }
    },
    [db.users, update],
  )

  const changePassword = useCallback(
    async (currentPassword: string, nextPassword: string) => {
      if (!user) return { ok: false, error: 'You need to sign in first.' }
      const valid = await verifyPassword(user, currentPassword)
      if (!valid) return { ok: false, error: 'Your current password is incorrect.' }
      const problem = passwordProblem(nextPassword)
      if (problem) return { ok: false, error: problem }
      const salt = generateSalt()
      const passwordHash = await hashPassword(nextPassword, salt)
      update('users', user.id, { passwordHash, passwordSalt: salt, mustChangePassword: false })
      return { ok: true }
    },
    [update, user],
  )

  const value = useMemo<AuthValue>(
    () => ({
      user,
      permissions,
      isAuthenticated: Boolean(user),
      signIn,
      signOut,
      register,
      activate,
      changePassword,
      can,
    }),
    [user, permissions, signIn, signOut, register, activate, changePassword, can],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
