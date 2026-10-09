import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { sql } from './db'
import { COOKIE, readSession } from './session'
import { can } from './roles'

export const currentUser = cache(async () => {
  const store = await cookies()
  const uid = await readSession(store.get(COOKIE)?.value)
  if (!uid) return null
  const rows = await sql`SELECT id, username, display_name, role FROM users WHERE id = ${uid} AND active`
  return rows[0] || null
})

export async function requireUser(min = 'employe') {
  const user = await currentUser()
  if (!user) redirect('/login')
  if (!can(user.role, min)) redirect('/')
  return user
}

export async function actionUser(min = 'employe') {
  const user = await currentUser()
  if (!user || !can(user.role, min)) return null
  return user
}
