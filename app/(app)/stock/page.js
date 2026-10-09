import { requireUser } from '@/lib/auth'
import { getItems } from '@/lib/data'
import { can, CATEGORIES } from '@/lib/roles'
import { money, num } from '@/lib/format'
import { AdjustForm } from './AdjustForm'

export const metadata = { title: 'Stock' }

function status(i) {
  if (i.quantity === 0) return ['out', 'Rupture']
  if (i.alert_threshold > 0 && i.quantity <= i.alert_threshold) return ['low', 'Bas']
  return ['ok', 'OK']
}

export default async function StockPage() {
  const user = await requireUser()
  const edit = can(user.role, 'manager')
  const items = await getItems()
  const value = items.reduce((s, i) => s + (i.buy_price || 0) * i.quantity, 0)
  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Inventaire</span>
          <h1>Stock</h1>
          <p>Quantités en temps réel. {edit ? 'Si le stock du site ne correspond pas au coffre en jeu, corrige-le avec « Corriger ».' : 'Seuls les managers peuvent corriger une quantité.'}</p>
        </div>
        {edit && <div className="stat" style={{ minWidth: 200 }}><span className="eyebrow">Valeur produits bruts</span><span className="v">{money(value)}</span></div>}
      </div>
      {Object.entries(CATEGORIES).map(([cat, label]) => (
        <section key={cat} className="panel">
          <h2>{label}</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Produit</th><th className="r">Stock</th><th className="r">Seuil</th><th>État</th>{edit && <th className="r">Corriger</th>}</tr></thead>
              <tbody>
                {items.filter((i) => i.category === cat).map((i) => {
                  const [cls, txt] = status(i)
                  return (
                    <tr key={i.id}>
                      <td>{i.name}</td>
                      <td className="r num" style={{ fontSize: 16 }}>{num(i.quantity)}</td>
                      <td className="r num faint">{i.alert_threshold || '—'}</td>
                      <td><span className={`pill ${cls}`}>{txt}</span></td>
                      {edit && <td className="r"><AdjustForm item={i} /></td>}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </>
  )
}
