'use client'

import { startTransition, useActionState, useState } from 'react'
import { craftAction } from '@/lib/actions'
import { Msg } from '@/components/Msg'

export function CraftCard({ card }) {
  const [state, action, pending] = useActionState(craftAction, null)
  const [times, setTimes] = useState(1)
  const t = Math.max(1, Number(times) || 1)
  return (
    <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startTransition(() => action(fd)) }} className={`recipe ${card.max > 0 ? 'ready' : ''}`}>
      <input type="hidden" name="recipe" value={card.id} />
      <h3>{card.name}</h3>
      <div className="chips">
        {card.inputs.map((x) => (
          <span key={x.id} className={`chip ${x.have < x.qty * t ? 'short' : ''}`}>
            <b>{x.qty * t}×</b>{x.name}<span className="have">/ {x.have}</span>
          </span>
        ))}
      </div>
      <div className="out">→ <b className="num">{card.outQty * t}×</b> <b>{card.outName}</b><span className="faint">(en stock : {card.outHave})</span></div>
      <div className="act">
        <input id={`times-${card.id}`} name="times" type="number" min="1" max="1000" value={times} onChange={(e) => setTimes(e.target.value)} aria-label="Nombre de préparations" />
        <button className="btn" disabled={pending || card.max < t}>{pending ? '…' : 'Préparer'}</button>
        <span className="max">Possible : {card.max}</span>
      </div>
      <Msg state={state} />
    </form>
  )
}
