'use server'

import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { sql, runScript, dbError } from './db'
import { COOKIE, MAX_AGE, signSession } from './session'
import { actionUser } from './auth'
import { ROLES, canManage } from './roles'
import { schemaSql } from '@/db/schema'
import { seedSql } from '@/db/seed'

const ok = (message) => ({ ok: true, message, t: Date.now() })
const fail = (error, fd) => ({ ok: false, error, values: fd ? keep(fd) : undefined, t: Date.now() })

function keep(fd) {
  const out = {}
  for (const [k, v] of fd.entries()) {
    if (typeof v === 'string' && !/password|^key$|^current$|^next$|^confirm$/.test(k) && !k.startsWith('$')) out[k] = v
  }
  return out
}
const DENIED = 'Tu n’as pas les droits pour faire ça.'

function str(fd, k) {
  return String(fd.get(k) ?? '').trim()
}

function int(fd, k) {
  const n = Number(fd.get(k))
  return Number.isInteger(n) ? n : NaN
}

function refresh() {
  revalidatePath('/', 'layout')
}

async function openSession(uid) {
  const store = await cookies()
  store.set(COOKIE, await signSession(uid), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE
  })
}

export async function needsSetup() {
  try {
    const rows = await sql`SELECT count(*)::int AS n FROM users`
    return rows[0].n === 0
  } catch {
    return true
  }
}

export async function setupAction(_, fd) {
  if (!process.env.SETUP_KEY || str(fd, 'key') !== process.env.SETUP_KEY) return fail('Code d’installation incorrect.', fd)
  const username = str(fd, 'username').toLowerCase()
  const name = str(fd, 'display_name')
  const password = str(fd, 'password')
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) return fail('Identifiant : 3 à 32 caractères, lettres, chiffres, point, tiret.', fd)
  if (!name) return fail('Indique ton nom RP.', fd)
  if (password.length < 8) return fail('Mot de passe : 8 caractères minimum.', fd)
  if (!(await needsSetup())) return fail('Le site est déjà installé. Connecte-toi.', fd)
  try {
    await runScript(schemaSql)
    await runScript(seedSql)
    const hash = await bcrypt.hash(password, 10)
    const rows = await sql`
      INSERT INTO users (username, display_name, password_hash, role)
      SELECT ${username}, ${name}, ${hash}, 'patron'
      WHERE NOT EXISTS (SELECT 1 FROM users)
      RETURNING id`
    if (!rows[0]) return fail('Le site est déjà installé. Connecte-toi.', fd)
    await openSession(rows[0].id)
  } catch (e) {
    return fail(dbError(e), fd)
  }
  redirect('/')
}

export async function loginAction(_, fd) {
  const username = str(fd, 'username').toLowerCase()
  const password = str(fd, 'password')
  let id
  try {
    const rows = await sql`SELECT id, password_hash FROM users WHERE username = ${username} AND active`
    if (!rows[0] || !(await bcrypt.compare(password, rows[0].password_hash))) {
      return fail('Identifiant ou mot de passe incorrect.', fd)
    }
    id = rows[0].id
    await openSession(id)
  } catch (e) {
    return fail(dbError(e), fd)
  }
  redirect('/')
}

export async function logoutAction() {
  const store = await cookies()
  store.delete(COOKIE)
  redirect('/login')
}

export async function craftAction(_, fd) {
  const user = await actionUser('employe')
  if (!user) return fail(DENIED)
  const recipe = str(fd, 'recipe')
  const times = int(fd, 'times')
  if (!(times >= 1)) return fail('Indique un nombre de préparations.')
  try {
    await sql`SELECT hs_craft(${user.id}, ${recipe}, ${times})`
  } catch (e) {
    return fail(dbError(e))
  }
  refresh()
  return ok(`Préparé ${times}×`)
}

function parseLines(fd) {
  try {
    const raw = JSON.parse(String(fd.get('lines') || '[]'))
    if (!Array.isArray(raw)) return null
    return raw
      .map((l) => ({ item: String(l.item), qty: Number(l.qty), price: Number(l.price) }))
      .filter((l) => l.qty > 0)
  } catch {
    return null
  }
}

export async function saleAction(_, fd) {
  const user = await actionUser('employe')
  if (!user) return fail(DENIED)
  const lines = parseLines(fd)
  if (!lines || !lines.length) return fail('Ajoute au moins un produit.')
  if (lines.some((l) => !Number.isInteger(l.qty) || !Number.isFinite(l.price) || l.price < 0)) return fail('Quantité ou prix invalide.')
  try {
    await sql`SELECT hs_sale(${user.id}, ${JSON.stringify(lines)}::jsonb, ${str(fd, 'note') || null})`
  } catch (e) {
    return fail(dbError(e))
  }
  refresh()
  return ok('Vente enregistrée.')
}

export async function purchaseAction(_, fd) {
  const user = await actionUser('manager')
  if (!user) return fail(DENIED)
  const lines = parseLines(fd)
  if (!lines || !lines.length) return fail('Ajoute au moins un produit.')
  if (lines.some((l) => !Number.isInteger(l.qty) || !Number.isFinite(l.price) || l.price < 0)) return fail('Quantité ou prix invalide.')
  try {
    await sql`SELECT hs_purchase(${user.id}, ${JSON.stringify(lines)}::jsonb, ${str(fd, 'note') || null})`
  } catch (e) {
    return fail(dbError(e))
  }
  refresh()
  return ok('Achat enregistré, stock mis à jour.')
}

export async function adjustAction(_, fd) {
  const user = await actionUser('manager')
  if (!user) return fail(DENIED)
  const qty = int(fd, 'quantity')
  if (!(qty >= 0)) return fail('Quantité invalide.', fd)
  try {
    await sql`SELECT hs_adjust(${user.id}, ${str(fd, 'item')}, ${qty}, ${str(fd, 'note') || null})`
  } catch (e) {
    return fail(dbError(e), fd)
  }
  refresh()
  return ok('Stock corrigé.')
}

export async function moneyAction(_, fd) {
  const user = await actionUser('manager')
  if (!user) return fail(DENIED)
  const kind = str(fd, 'kind')
  const label = str(fd, 'label')
  const amount = Number(String(fd.get('amount') || '').replace(',', '.'))
  if (!['depense', 'recette'].includes(kind)) return fail('Type invalide.', fd)
  if (!label) return fail('Indique un libellé.', fd)
  if (!Number.isFinite(amount) || amount <= 0) return fail('Montant invalide.', fd)
  const signed = kind === 'depense' ? -amount : amount
  try {
    await sql`INSERT INTO operations (user_id, kind, label, amount, note) VALUES (${user.id}, ${kind}, ${label}, ${signed}, ${str(fd, 'note') || null})`
  } catch (e) {
    return fail(dbError(e), fd)
  }
  refresh()
  return ok(kind === 'depense' ? 'Dépense enregistrée.' : 'Recette enregistrée.')
}

export async function createUserAction(_, fd) {
  const user = await actionUser('copatron')
  if (!user) return fail(DENIED)
  const username = str(fd, 'username').toLowerCase()
  const name = str(fd, 'display_name')
  const role = str(fd, 'role')
  const password = str(fd, 'password')
  if (!ROLES[role]) return fail('Rôle invalide.', fd)
  if (!canManage(user.role, role, role)) return fail('Tu ne peux pas créer ce rôle.', fd)
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) return fail('Identifiant : 3 à 32 caractères, lettres, chiffres, point, tiret.', fd)
  if (!name) return fail('Indique le nom RP.', fd)
  if (password.length < 8) return fail('Mot de passe : 8 caractères minimum.', fd)
  try {
    const hash = await bcrypt.hash(password, 10)
    const rows = await sql`
      INSERT INTO users (username, display_name, password_hash, role)
      VALUES (${username}, ${name}, ${hash}, ${role})
      ON CONFLICT (username) DO NOTHING RETURNING id`
    if (!rows[0]) return fail('Cet identifiant existe déjà.', fd)
  } catch (e) {
    return fail(dbError(e), fd)
  }
  refresh()
  return ok(`Compte ${username} créé.`)
}

async function targetFor(user, fd) {
  const id = int(fd, 'id')
  if (id === user.id) return { error: 'Tu ne peux pas modifier ton propre compte ici.' }
  const rows = await sql`SELECT id, role FROM users WHERE id = ${id}`
  if (!rows[0]) return { error: 'Compte introuvable.' }
  return { target: rows[0] }
}

export async function updateUserAction(_, fd) {
  const user = await actionUser('copatron')
  if (!user) return fail(DENIED)
  try {
    const { target, error } = await targetFor(user, fd)
    if (error) return fail(error)
    const role = str(fd, 'role')
    const active = fd.get('active') === 'on'
    if (!ROLES[role]) return fail('Rôle invalide.')
    if (!canManage(user.role, target.role, role)) return fail(DENIED)
    await sql`UPDATE users SET role = ${role}, active = ${active} WHERE id = ${target.id}`
  } catch (e) {
    return fail(dbError(e))
  }
  refresh()
  return ok('Compte mis à jour.')
}

export async function resetPasswordAction(_, fd) {
  const user = await actionUser('copatron')
  if (!user) return fail(DENIED)
  const password = str(fd, 'password')
  if (password.length < 8) return fail('Mot de passe : 8 caractères minimum.')
  try {
    const { target, error } = await targetFor(user, fd)
    if (error) return fail(error)
    if (!canManage(user.role, target.role, target.role)) return fail(DENIED)
    const hash = await bcrypt.hash(password, 10)
    await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${target.id}`
  } catch (e) {
    return fail(dbError(e))
  }
  return ok('Mot de passe changé.')
}

export async function changePasswordAction(_, fd) {
  const user = await actionUser('employe')
  if (!user) return fail(DENIED)
  const current = str(fd, 'current')
  const next = str(fd, 'next')
  if (next.length < 8) return fail('Nouveau mot de passe : 8 caractères minimum.')
  if (next !== str(fd, 'confirm')) return fail('Les deux mots de passe ne correspondent pas.')
  try {
    const rows = await sql`SELECT password_hash FROM users WHERE id = ${user.id}`
    if (!(await bcrypt.compare(current, rows[0].password_hash))) return fail('Mot de passe actuel incorrect.')
    const hash = await bcrypt.hash(next, 10)
    await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${user.id}`
  } catch (e) {
    return fail(dbError(e))
  }
  return ok('Mot de passe changé.')
}

export async function saveSettingsAction(_, fd) {
  const user = await actionUser('copatron')
  if (!user) return fail(DENIED)
  let rows
  try {
    rows = JSON.parse(String(fd.get('items') || '[]'))
  } catch {
    return fail('Données invalides.')
  }
  const clean = []
  for (const r of rows) {
    const p = (v) => (v === '' || v === null || v === undefined ? null : Number(String(v).replace(',', '.')))
    const buy = p(r.buy_price)
    const sell = p(r.sell_price)
    const alert = Number(r.alert_threshold)
    if ((buy !== null && !(buy >= 0)) || (sell !== null && !(sell >= 0)) || !Number.isInteger(alert) || alert < 0) {
      return fail(`Valeur invalide pour ${r.name || r.id}.`)
    }
    clean.push({ id: String(r.id), buy_price: buy, sell_price: sell, alert_threshold: alert })
  }
  try {
    await sql`
      UPDATE items i SET buy_price = x.buy_price, sell_price = x.sell_price, alert_threshold = x.alert_threshold
      FROM jsonb_to_recordset(${JSON.stringify(clean)}::jsonb) AS x(id TEXT, buy_price NUMERIC, sell_price NUMERIC, alert_threshold INTEGER)
      WHERE i.id = x.id`
  } catch (e) {
    return fail(dbError(e))
  }
  refresh()
  return ok('Paramètres enregistrés.')
}

export async function migrateAction() {
  const user = await actionUser('patron')
  if (!user) return fail(DENIED)
  try {
    await runScript(schemaSql)
    await runScript(seedSql)
  } catch (e) {
    return fail(dbError(e))
  }
  refresh()
  return ok('Base mise à jour.')
}
