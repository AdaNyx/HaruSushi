import { requireUser } from '@/lib/auth'
import { getItems, getOperations, periodStart } from '@/lib/data'
import { purchaseAction } from '@/lib/actions'
import { Cart } from '@/components/Cart'
import { OpsTable } from '@/components/OpsTable'

export const metadata = { title: 'Achats' }

export default async function AchatsPage() {
  await requireUser('manager')
  const [items, ops] = await Promise.all([
    getItems(),
    getOperations({ since: periodStart('mois'), kind: 'achat', limit: 50 })
  ])
  const products = items
    .filter((i) => i.category === 'brut' || i.category === 'boisson')
    .map((i) => ({ id: i.id, name: i.name, price: i.buy_price, stock: i.quantity }))
  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Grossiste</span>
          <h1>Achats</h1>
          <p>Enregistre ce que tu as acheté au grossiste ou ailleurs. Le stock augmente et la dépense passe en compta. Le saumon et le thon n’ont pas de prix fixe : indique ce que tu les as payés.</p>
        </div>
      </div>
      <Cart products={products} action={purchaseAction} mode="achat" submitLabel="Enregistrer l’achat" notePlaceholder="Fournisseur ou remarque (facultatif)" />
      <section className="panel">
        <h2>Achats des 30 derniers jours</h2>
        <OpsTable ops={ops} />
      </section>
    </>
  )
}
