import { SignJWT, jwtVerify } from 'jose'

export const COOKIE = 'hs_session'
export const MAX_AGE = 60 * 60 * 24 * 7

function key() {
  return new TextEncoder().encode(process.env.AUTH_SECRET || '')
}

export async function signSession(uid) {
  return new SignJWT({ uid })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key())
}

export async function readSession(token) {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, key())
    return typeof payload.uid === 'number' ? payload.uid : null
  } catch {
    return null
  }
}
