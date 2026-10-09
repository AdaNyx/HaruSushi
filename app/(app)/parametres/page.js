import { requireUser } from '@/lib/auth'
import { getItems, getRecipes } from '@/lib/data'
import { SettingsForm, MigrateButton } from './forms'

export const metadata = { title: 'Paramètres' }

function unitCosts(items, recipes) {
  const byId = Object.fromEntries(items.map((i) => [i.id, i]))
  const rec = Object.fromEntries(recipes.map((r) => [r.output_item, r]))
  const memo = {}
  const cost = (id) => {
    if (memo[id] !== undefined) return memo[id]
    const r = rec[id]
    if (!r) {
      memo[id] = byId[id].buy_price
      return memo[id]
    }
    let total = 0
    for (const x of r.inputs) {
      const c = cost(x.item)
      if (c === null) { memo[id] = null; return null }
      total += c * x.qty
    }
    memo[id] = total / r.output_qty
    return memo[id]
  }
  return Object.fromEntries(items.map((i) => [i.id, cost(i.id)]))
}

export default async function ParametresPage() {
  const me = await requireUser('copatron')
  const [items, recipes] = await Promise.all([getItems(), getRecipes()])
  const costs = unitCosts(items, recipes)
  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Réglages</span>
          <h1>Paramètres</h1>
          <p>Prix d’achat, prix de vente et seuil d’alerte de chaque produit. Le coût de revient est calculé à partir des recettes et des prix d’achat.</p>
        </div>
      </div>
      <SettingsForm items={items.map((i) => ({ id: i.id, name: i.name, category: i.category, buy_price: i.buy_price, sell_price: i.sell_price, alert_threshold: i.alert_threshold, cost: costs[i.id] }))} />
      {me.role === 'patron' && <MigrateButton />}
    </>
  )
}
