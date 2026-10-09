import { requireUser } from '@/lib/auth'
import { getItems, getOperations, periodStart } from '@/lib/data'
import { can } from '@/lib/roles'
import { saleAction } from '@/lib/actions'
import { Cart } from '@/components/Cart'
import { OpsTable } from '@/components/OpsTable'

export const metadata = { title: 'Ventes' }

export default async function VentesPage() {
  const user = await requireUser()
  const boss = can(user.role, 'manager')
  const [items, ops] = await Promise.all([
    getItems(),
    getOperations({ since: periodStart('jour'), kind: 'vente', userId: boss ? null : user.id, limit: 50 })
  ])
  const products = items
    .filter((i) => i.category === 'fini' || i.category === 'boisson')
    .map((i) => ({ id: i.id, name: i.name, price: i.sell_price, stock: i.quantity }))
  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Caisse</span>
          <h1>Ventes</h1>
          <p>Enregistre chaque vente faite en jeu. Le stock de plats baisse et l’argent entre dans la caisse. Le prix se remplit tout seul, tu peux le modifier pour une promo.</p>
        </div>
      </div>
      <Cart products={products} action={saleAction} mode="vente" submitLabel="Encaisser" notePlaceholder="Client ou remarque (facultatif)" />
      <section className="panel">
        <h2>{boss ? 'Ventes du jour' : 'Mes ventes du jour'}</h2>
        <OpsTable ops={ops} showUser={boss} />
      </section>
    </>
  )
}
