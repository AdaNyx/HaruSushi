'use client'

import { startTransition, useActionState, useState } from 'react'
import { saveSettingsAction, migrateAction } from '@/lib/actions'
import { CATEGORIES } from '@/lib/roles'
import { Msg } from '@/components/Msg'

const fmt = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })
const v = (x) => (x === null || x === undefined ? '' : String(x))

export function SettingsForm({ items }) {
  const [state, action, pending] = useActionState(saveSettingsAction, null)
  const [rows, setRows] = useState(() => items.map((i) => ({ ...i, buy_price: v(i.buy_price), sell_price: v(i.sell_price), alert_threshold: v(i.alert_threshold) })))
  const set = (id, k, val) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [k]: val } : r)))
  const sellable = (c) => c === 'fini' || c === 'boisson'
  const buyable = (c) => c === 'brut' || c === 'boisson'
  return (
    <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startTransition(() => action(fd)) }} className="grid" style={{ gap: 14 }}>
      <input type="hidden" name="items" value={JSON.stringify(rows.map((r) => ({ id: r.id, name: r.name, buy_price: buyable(r.category) ? r.buy_price : null, sell_price: sellable(r.category) ? r.sell_price : null, alert_threshold: Number(r.alert_threshold || 0) })))} />
      {Object.entries(CATEGORIES).map(([cat, label]) => (
        <section key={cat} className="panel">
          <h2>{label}</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Produit</th>{buyable(cat) && <th>Prix d’achat</th>}{!buyable(cat) && <th className="r">Coût de revient</th>}{sellable(cat) && <th>Prix de vente</th>}{sellable(cat) && <th className="r">Marge</th>}<th>Seuil d’alerte</th></tr></thead>
              <tbody>
                {rows.filter((r) => r.category === cat).map((r) => {
                  const sell = Number(r.sell_price)
                  const cost = buyable(cat) ? (r.buy_price === '' ? null : Number(r.buy_price)) : r.cost
                  const margin = r.sell_price !== '' && cost !== null ? sell - cost : null
                  return (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      {buyable(cat) && <td><input id={`buy-${r.id}`} type="number" min="0" step="0.01" value={r.buy_price} placeholder="variable" onChange={(e) => set(r.id, 'buy_price', e.target.value)} style={{ width: 110 }} /></td>}
                      {!buyable(cat) && <td className="r num faint">{r.cost === null ? 'dépend du poisson' : `${fmt.format(r.cost)} $`}</td>}
                      {sellable(cat) && <td><input id={`sell-${r.id}`} type="number" min="0" step="0.01" value={r.sell_price} placeholder="à définir" onChange={(e) => set(r.id, 'sell_price', e.target.value)} style={{ width: 110 }} /></td>}
                      {sellable(cat) && <td className={`r num ${margin === null ? 'faint' : margin >= 0 ? 'pos' : 'neg'}`}>{margin === null ? '—' : `${fmt.format(margin)} $`}</td>}
                      <td><input id={`alert-${r.id}`} type="number" min="0" step="1" value={r.alert_threshold} onChange={(e) => set(r.id, 'alert_threshold', e.target.value)} style={{ width: 80 }} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      <div className="panel gold" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', position: 'sticky', bottom: 12 }}>
        <Msg state={state} />
        <button className="btn" disabled={pending} style={{ marginLeft: 'auto' }}>{pending ? 'Enregistrement…' : 'Enregistrer les paramètres'}</button>
      </div>
    </form>
  )
}

export function MigrateButton() {
  const [state, action, pending] = useActionState(migrateAction, null)
  return (
    <form action={action} className="panel">
      <h2>Base de données</h2>
      <p className="muted">À utiliser après une mise à jour du site : réinstalle les fonctions et les recettes sans toucher au stock, aux prix ni à la compta.</p>
      <Msg state={state} />
      <div><button className="btn ghost" disabled={pending}>{pending ? 'Mise à jour…' : 'Mettre à jour la base'}</button></div>
    </form>
  )
}
