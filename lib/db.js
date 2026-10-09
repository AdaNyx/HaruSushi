import { neon, Pool } from '@neondatabase/serverless'

let client

export function sql(strings, ...values) {
  if (!client) client = neon(process.env.DATABASE_URL)
  return client(strings, ...values)
}

export async function runScript(text) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    await pool.query(text)
  } finally {
    await pool.end()
  }
}

export function dbError(e) {
  const m = String(e?.message || '')
  const i = m.indexOf('HS:')
  if (i >= 0) return m.slice(i + 3)
  console.error(e)
  return 'Erreur serveur, réessaie dans un instant.'
}
