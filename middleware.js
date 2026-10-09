import { NextResponse } from 'next/server'
import { COOKIE, readSession } from './lib/session'

export async function middleware(req) {
  const uid = await readSession(req.cookies.get(COOKIE)?.value)
  if (!uid) return NextResponse.redirect(new URL('/login', req.url))
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!login|_next/static|_next/image|favicon.ico|icon.svg).*)']
}
