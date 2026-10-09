import { requireUser } from '@/lib/auth'
import { getItems, getRecipes } from '@/lib/data'
import { STATIONS } from '@/lib/roles'
import { CraftCard } from './CraftCard'

export const metadata = { title: 'Préparer' }

export default async function PreparerPage() {
  await requireUser()
  const [items, recipes] = await Promise.all([getItems(), getRecipes()])
  const byId = Object.fromEntries(items.map((i) => [i.id, i]))
  const cards = recipes.map((r) => {
    const inputs = r.inputs.map((x) => ({ id: x.item, name: byId[x.item].name, qty: x.qty, have: byId[x.item].quantity }))
    const max = Math.min(...inputs.map((x) => Math.floor(x.have / x.qty)))
    return { id: r.id, name: r.name, station: r.station, outName: byId[r.output_item].name, outQty: r.output_qty, outHave: byId[r.output_item].quantity, inputs, max }
  })
  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Production</span>
          <h1>Préparer</h1>
          <p>Déclare ce que tu viens de préparer en jeu. Les ingrédients sont retirés du stock et le produit est ajouté automatiquement.</p>
        </div>
      </div>
      {Object.entries(STATIONS).map(([key, label]) => (
        <section key={key} className="grid" style={{ gap: 12 }}>
          <h2>{label}</h2>
          <div className="grid cards">
            {cards.filter((c) => c.station === key).map((c) => <CraftCard key={c.id} card={c} />)}
          </div>
        </section>
      ))}
    </>
  )
}
