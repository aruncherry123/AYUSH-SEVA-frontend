import type { User } from '../types'

const SESSION_KEY = 'Ayush Seva.session.v1'
const ITERATIONS = 100_000

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

/** PBKDF2-SHA256, 100k iterations. Only the derived hash is ever persisted. */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  )
  return toHex(new Uint8Array(bits))
}

export function generateSalt(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(16)))
}

export function generateToken(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(24)))
}

const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'

/** Human-friendly one-time credential shown to an administrator after creation. */
export function generateTemporaryPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(10))
  const body = Array.from(bytes)
    .map((byte) => PASSWORD_ALPHABET[byte % PASSWORD_ALPHABET.length])
    .join('')
  return `As-${body}`
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  if (!user.passwordHash || !user.passwordSalt) return false
  const candidate = await hashPassword(password, user.passwordSalt)
  const expected = user.passwordHash
  if (candidate.length !== expected.length) return false
  let mismatch = 0
  for (let index = 0; index < candidate.length; index++) {
    mismatch |= candidate.charCodeAt(index) ^ expected.charCodeAt(index)
  }
  return mismatch === 0
}

export function passwordProblem(password: string): string | null {
  if (password.length < 8) return 'Use at least 8 characters for your password.'
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Include at least one letter and one number.'
  }
  return null
}

export function readSession(): string | null {
  try {
    return window.localStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

export function writeSession(userId: string) {
  try {
    window.localStorage.setItem(SESSION_KEY, userId)
  } catch {
    // Session remains in memory when storage is unavailable.
  }
}

export function clearSession() {
  try {
    window.localStorage.removeItem(SESSION_KEY)
  } catch {
    // Ignore privacy-mode failures.
  }
}
