'use client'

import { startTransition, useActionState, useEffect, useState } from 'react'
import { Msg } from './Msg'

const fmt = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })

export function Cart({ products, action, mode, submitLabel, notePlaceholder }) {
  const [state, formAction, pending] = useActionState(action, null)
  const [lines, setLines] = useState([])
  const [note, setNote] = useState('')
  useEffect(() => {
    if (state?.ok) {
      setLines([])
      setNote('')
    }
  }, [state])

  const byId = Object.fromEntries(products.map((p) => [p.id, p]))
  const add = (p) => {
    setLines((ls) => {
      const found = ls.find((l) => l.item === p.id)
      if (found) return ls.map((l) => (l.item === p.id ? { ...l, qty: String((Number(l.qty) || 0) + 1) } : l))
      return [...ls, { item: p.id, qty: '1', price: p.price === null ? '' : String(p.price) }]
    })
  }
  const set = (id, k, v) => setLines((ls) => ls.map((l) => (l.item === id ? { ...l, [k]: v } : l)))
  const remove = (id) => setLines((ls) => ls.filter((l) => l.item !== id))

  const parsed = lines.map((l) => ({ item: l.item, qty: Number(l.qty), price: Number(String(l.price).replace(',', '.')) }))
  const total = parsed.reduce((s, l) => s + (l.qty > 0 && l.price >= 0 ? l.qty * l.price : 0), 0)
  const missingPrice = lines.some((l) => l.price === '')
  const overStock = mode === 'vente' && parsed.some((l) => l.qty > byId[l.item].stock)

  return (
    <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startTransition(() => formAction(fd)) }} className="panel gold">
      <div className="panel-head"><h2>{mode === 'vente' ? 'Nouvelle vente' : 'Nouvel achat'}</h2><span className="faint">Clique un produit pour l’ajouter</span></div>
      <div className="picker">
        {products.map((p) => (
          <button type="button" key={p.id} onClick={() => add(p)} disabled={mode === 'vente' && p.stock === 0} style={mode === 'vente' && p.stock === 0 ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}>
            {p.name}<span className="num">{mode === 'vente' ? p.stock : p.price === null ? 'prix libre' : `${p.price} $`}</span>
          </button>
        ))}
      </div>

      {lines.length > 0 ? (
        <div className="grid" style={{ gap: 8 }}>
          <div className="cart-line cart-head"><span>Produit</span><span>Qté</span><span>Prix unit.</span><span style={{ textAlign: 'right' }}>Total</span><span /></div>
          {lines.map((l) => {
            const p = byId[l.item]
            const over = mode === 'vente' && Number(l.qty) > p.stock
            return (
              <div key={l.item} className="cart-line">
                <span>{p.name}{mode === 'vente' && <span className={over ? 'neg' : 'faint'} style={{ fontSize: 12.5 }}> · {p.stock} en stock</span>}</span>
                <input id={`qty-${l.item}`} type="number" min="1" value={l.qty} onChange={(e) => set(l.item, 'qty', e.target.value)} aria-label={`Quantité ${p.name}`} />
                <input id={`price-${l.item}`} type="number" min="0" step="0.01" value={l.price} placeholder="Prix" onChange={(e) => set(l.item, 'price', e.target.value)} aria-label={`Prix ${p.name}`} />
                <span className="total">{fmt.format((Number(l.qty) || 0) * (Number(l.price) || 0))} $</span>
                <button type="button" className="x" onClick={() => remove(l.item)} aria-label={`Retirer ${p.name}`}>×</button>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="empty">Aucun produit pour l’instant.</p>
      )}

      <input id={`${mode}-note`} value={note} onChange={(e) => setNote(e.target.value)} name="note" placeholder={notePlaceholder} />
      <input type="hidden" name="lines" value={JSON.stringify(parsed)} />
      <Msg state={state} />
      <div className="cart-foot">
        <span><span className="eyebrow">Total</span> <span className="big">{fmt.format(total)} $</span></span>
        <button className="btn" disabled={pending || !lines.length || missingPrice || overStock}>{pending ? 'Enregistrement…' : submitLabel}</button>
      </div>
      {missingPrice && <p className="faint" style={{ fontSize: 13 }}>Indique un prix pour chaque produit.</p>}
    </form>
  )
}
