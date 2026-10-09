'use client'

import { useMemo, useState } from 'react'
import { STATIONS } from '@/lib/roles'

const fmt = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })

export function Calculator({ items, recipes }) {
  const byId = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])), [items])
  const recipeFor = useMemo(() => Object.fromEntries(recipes.map((r) => [r.output_item, r])), [recipes])
  const depth = useMemo(() => {
    const memo = {}
    const d = (id) => {
      if (memo[id] !== undefined) return memo[id]
      const r = recipeFor[id]
      memo[id] = r ? 1 + Math.max(...r.inputs.map((x) => d(x.item))) : 0
      return memo[id]
    }
    items.forEach((i) => d(i.id))
    return memo
  }, [items, recipeFor])

  const finals = items.filter((i) => i.category === 'fini')
  const [want, setWant] = useState(() => Object.fromEntries(finals.map((i) => [i.id, ''])))
  const [useStock, setUseStock] = useState(true)
  const [fish, setFish] = useState({})

  const result = useMemo(() => {
    const demand = {}
    for (const [k, v] of Object.entries(want)) {
      const n = Math.max(0, Math.floor(Number(v) || 0))
      if (n) demand[k] = n
    }
    const avail = Object.fromEntries(items.map((i) => [i.id, useStock ? i.quantity : 0]))
    const crafts = {}
    const left = {}
    const fromStock = {}
    const order = [...items].sort((a, b) => depth[b.id] - depth[a.id])
    for (const it of order) {
      let need = demand[it.id] || 0
      if (!need) continue
      const take = Math.min(avail[it.id], need)
      if (take) fromStock[it.id] = take
      need -= take
      const r = recipeFor[it.id]
      if (r && need > 0) {
        const c = Math.ceil(need / r.output_qty)
        crafts[r.id] = { recipe: r, times: c }
        if (c * r.output_qty > need) left[it.id] = c * r.output_qty - need
        for (const x of r.inputs) demand[x.item] = (demand[x.item] || 0) + x.qty * c
      }
      if (!r) demand[it.id] = need
    }
    const buy = items.filter((i) => !recipeFor[i.id] && i.category !== 'boisson' && demand[i.id] > 0).map((i) => {
      const price = i.buy_price !== null ? i.buy_price : Number(fish[i.id]) || null
      return { ...i, need: demand[i.id], price, cost: price ? price * demand[i.id] : null }
    })
    const steps = Object.values(crafts).sort((a, b) => depth[a.recipe.output_item] - depth[b.recipe.output_item])
    return { buy, steps, left, fromStock }
  }, [want, useStock, fish, items, recipeFor, depth])

  const budget = result.buy.reduce((s, b) => s + (b.cost || 0), 0)
  const unpriced = result.buy.filter((b) => b.price === null)
  const totalCrafts = result.steps.reduce((s, x) => s + x.times, 0)
  const fishItems = items.filter((i) => i.category === 'brut' && i.buy_price === null)

  return (
    <div className="grid calc-grid">
      <section className="panel">
        <h2>Je veux</h2>
        {finals.map((i) => (
          <label key={i.id} className="field" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', color: 'var(--ink)', fontSize: 14 }}>
            {i.name}
            <input id={`want-${i.id}`} type="number" min="0" value={want[i.id]} placeholder="0" onChange={(e) => setWant({ ...want, [i.id]: e.target.value })} style={{ width: 80 }} />
          </label>
        ))}
        <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, color: 'var(--ink)' }}>
          <input id="use-stock" type="checkbox" checked={useStock} onChange={(e) => setUseStock(e.target.checked)} />
          Déduire ce qu’on a déjà en stock
        </label>
        {fishItems.length > 0 && (
          <>
            <span className="eyebrow">Prix du poisson</span>
            {fishItems.map((i) => (
              <label key={i.id} className="field" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                {i.name} ($ / pièce)
                <input id={`fish-${i.id}`} type="number" min="0" value={fish[i.id] || ''} placeholder="?" onChange={(e) => setFish({ ...fish, [i.id]: e.target.value })} style={{ width: 80 }} />
              </label>
            ))}
          </>
        )}
        <button type="button" className="btn ghost" onClick={() => setWant(Object.fromEntries(finals.map((i) => [i.id, ''])))}>Tout remettre à zéro</button>
      </section>

      <div className="grid" style={{ gap: 14 }}>
        <div className="stats">
          <div className="stat lead"><span className="eyebrow">Budget achats</span><span className="v">{fmt.format(budget)} ${unpriced.length ? ' +' : ''}</span>{unpriced.length > 0 && <span className="faint">+ {unpriced.map((u) => u.name.toLowerCase()).join(' et ')}</span>}</div>
          <div className="stat"><span className="eyebrow">Préparations</span><span className="v">{totalCrafts}</span></div>
        </div>
        <section className="panel">
          <h2>À acheter</h2>
          {result.buy.length ? (
            <div className="table-wrap"><table><tbody>
              {result.buy.map((b) => (
                <tr key={b.id}><td>{b.name}</td><td className="r num" style={{ fontSize: 16 }}>{b.need}</td><td className="r num faint">{b.price !== null ? `× ${fmt.format(b.price)} $` : 'prix ?'}</td><td className="r num">{b.cost !== null ? `${fmt.format(b.cost)} $` : '—'}</td></tr>
              ))}
            </tbody></table></div>
          ) : <p className="empty">Rien à acheter{Object.keys(want).some((k) => Number(want[k]) > 0) ? ', le stock suffit.' : '. Indique ce que tu veux à gauche.'}</p>}
        </section>
        <section className="panel">
          <h2>Préparations, dans l’ordre</h2>
          {result.steps.length ? (
            <div className="table-wrap"><table><tbody>
              {result.steps.map(({ recipe, times }) => (
                <tr key={recipe.id}><td className="faint" style={{ whiteSpace: 'nowrap' }}>{STATIONS[recipe.station]}</td><td>{recipe.name}<div className="lines">donne {times * recipe.output_qty} {byId[recipe.output_item].name.toLowerCase()}</div></td><td className="r num" style={{ fontSize: 16 }}>{times}×</td></tr>
              ))}
            </tbody></table></div>
          ) : <p className="empty">Aucune préparation nécessaire.</p>}
        </section>
        {(Object.keys(result.left).length > 0 || (useStock && Object.keys(result.fromStock).length > 0)) && (
          <section className="panel">
            <h2>Stock</h2>
            {useStock && Object.keys(result.fromStock).length > 0 && (
              <div><span className="eyebrow">Pris dans le stock</span><div className="chips" style={{ marginTop: 6 }}>{Object.entries(result.fromStock).map(([k, v]) => <span key={k} className="chip"><b>{v}×</b>{byId[k].name}</span>)}</div></div>
            )}
            {Object.keys(result.left).length > 0 && (
              <div><span className="eyebrow">Il restera en plus</span><div className="chips" style={{ marginTop: 6 }}>{Object.entries(result.left).map(([k, v]) => <span key={k} className="chip"><b>+{v}</b>{byId[k].name}</span>)}</div></div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
