import { sql } from './db'

export async function getItems() {
  const rows = await sql`SELECT id, name, category, buy_price, sell_price, quantity, alert_threshold FROM items ORDER BY sort, name`
  return rows.map((r) => ({
    ...r,
    buy_price: r.buy_price === null ? null : Number(r.buy_price),
    sell_price: r.sell_price === null ? null : Number(r.sell_price)
  }))
}

export async function getRecipes() {
  return sql`
    SELECT r.id, r.name, r.station, r.output_item, r.output_qty,
      json_agg(json_build_object('item', ri.item_id, 'qty', ri.qty) ORDER BY ri.item_id) AS inputs
    FROM recipes r JOIN recipe_inputs ri ON ri.recipe_id = r.id
    GROUP BY r.id ORDER BY r.sort`
}

export const PERIODS = {
  jour: { label: 'Aujourd’hui', days: 0 },
  semaine: { label: '7 jours', days: 7 },
  mois: { label: '30 jours', days: 30 },
  tout: { label: 'Tout', days: null }
}

export function periodStart(key) {
  const p = PERIODS[key] || PERIODS.semaine
  if (p.days === null) return new Date(0).toISOString()
  const now = new Date()
  const paris = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
  const offset = now.getTime() - paris.getTime()
  paris.setHours(0, 0, 0, 0)
  if (p.days > 0) paris.setDate(paris.getDate() - (p.days - 1))
  return new Date(paris.getTime() + offset).toISOString()
}

export async function getTotals(since) {
  const rows = await sql`
    SELECT
      COALESCE(SUM(amount) FILTER (WHERE amount > 0), 0) AS income,
      COALESCE(-SUM(amount) FILTER (WHERE amount < 0), 0) AS expense,
      COALESCE(SUM(amount) FILTER (WHERE kind = 'vente'), 0) AS sales,
      COALESCE(-SUM(amount) FILTER (WHERE kind = 'achat'), 0) AS purchases,
      COUNT(*) FILTER (WHERE kind = 'vente')::int AS sale_count,
      COUNT(*) FILTER (WHERE kind = 'preparation')::int AS craft_count
    FROM operations WHERE created_at >= ${since}`
  const r = rows[0]
  return {
    income: Number(r.income),
    expense: Number(r.expense),
    sales: Number(r.sales),
    purchases: Number(r.purchases),
    saleCount: r.sale_count,
    craftCount: r.craft_count
  }
}

export async function getCash() {
  const rows = await sql`SELECT COALESCE(SUM(amount), 0) AS cash FROM operations`
  return Number(rows[0].cash)
}

export async function getOperations({ since, kind, userId, limit = 200 }) {
  return sql`
    SELECT o.id, o.created_at, o.kind, o.label, o.amount, o.note, u.display_name AS user_name,
      COALESCE((
        SELECT json_agg(json_build_object('name', i.name, 'delta', m.delta, 'price', m.unit_price) ORDER BY m.id)
        FROM movements m JOIN items i ON i.id = m.item_id WHERE m.operation_id = o.id
      ), '[]') AS lines
    FROM operations o LEFT JOIN users u ON u.id = o.user_id
    WHERE o.created_at >= ${since}
      AND (${kind || null}::text IS NULL OR o.kind = ${kind || null})
      AND (${userId || null}::int IS NULL OR o.user_id = ${userId || null})
    ORDER BY o.created_at DESC, o.id DESC
    LIMIT ${limit}`
}

export async function getProductSales(since) {
  const rows = await sql`
    SELECT i.name, SUM(-m.delta)::int AS qty, SUM(-m.delta * m.unit_price) AS total
    FROM movements m JOIN operations o ON o.id = m.operation_id JOIN items i ON i.id = m.item_id
    WHERE o.kind = 'vente' AND o.created_at >= ${since}
    GROUP BY i.name ORDER BY total DESC`
  return rows.map((r) => ({ ...r, total: Number(r.total) }))
}

export async function getStaffActivity(since) {
  const rows = await sql`
    SELECT u.display_name AS name,
      COUNT(*) FILTER (WHERE o.kind = 'preparation')::int AS crafts,
      COUNT(*) FILTER (WHERE o.kind = 'vente')::int AS sales,
      COALESCE(SUM(o.amount) FILTER (WHERE o.kind = 'vente'), 0) AS sales_total
    FROM operations o JOIN users u ON u.id = o.user_id
    WHERE o.created_at >= ${since}
    GROUP BY u.display_name ORDER BY sales_total DESC, crafts DESC`
  return rows.map((r) => ({ ...r, sales_total: Number(r.sales_total) }))
}

export async function getUsers() {
  return sql`SELECT id, username, display_name, role, active, created_at FROM users ORDER BY active DESC, CASE role WHEN 'patron' THEN 1 WHEN 'copatron' THEN 2 WHEN 'manager' THEN 3 ELSE 4 END, display_name`
}
